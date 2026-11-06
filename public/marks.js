const $ = id => document.getElementById(id);
const form = $('marksForm');
const message = $('message');
const say = (text, bad = false) => { message.textContent = text; message.className = `message ${bad ? 'error' : 'success'}`; };
async function api(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) { window.location.href = 'faculty-login.html'; throw new Error('Please log in as faculty.'); }
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}
async function loadFaculty() {
  try {
    const data = await api('/api/faculty/me');
    $('facultyGreeting').textContent = `Welcome, ${data.faculty.name}`;
  } catch { window.location.href = 'faculty-login.html'; }
}
async function loadBranches() {
  const branches = await api('/api/departments');
  ['branch', 'listBranch'].forEach(id => {
    const select = $(id);
    branches.forEach(branch => {
      const option = document.createElement('option');
      option.value = branch;
      option.textContent = branch;
      select.appendChild(option);
    });
  });
}
async function loadStudents() {
  const branch = $('branch').value;
  $('student').innerHTML = '<option value="">Select student</option>';
  $('student').disabled = true;
  if (!branch) return;
  const students = await api(`/api/students?department=${encodeURIComponent(branch)}`);
  students.forEach(student => {
    const option = document.createElement('option');
    option.value = student.roll_no;
    option.textContent = `${student.roll_no} - ${student.name}`;
    $('student').appendChild(option);
  });
  $('student').disabled = false;
  if (!students.length) $('student').innerHTML = '<option value="">No students in this branch</option>';
}
async function loadMarks() {
  const branch = $('listBranch').value;
  const rows = await api(`/api/marks?department=${encodeURIComponent(branch)}`);
  const body = $('marksBody');
  body.innerHTML = '';
  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="7" class="empty">No marks recorded yet.</td></tr>';
    return;
  }
  rows.forEach(row => {
    const tr = document.createElement('tr');
    [row.roll_no, row.name, row.department, row.subject, row.semester, row.exam_type, `${row.marks_obtained} / ${row.max_marks}`].forEach(value => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    });
    body.appendChild(tr);
  });
}
$('branch').addEventListener('change', loadStudents);
$('listBranch').addEventListener('change', () => loadMarks().catch(e => say(e.message, true)));
$('marksObtained').addEventListener('input', () => {
  const max = Number($('maxMarks').value);
  $('marksObtained').setCustomValidity(Number($('marksObtained').value) > max ? 'Obtained marks cannot exceed maximum marks.' : '');
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  const max = Number($('maxMarks').value);
  const obtained = Number($('marksObtained').value);
  if (obtained > max) return say('Obtained marks cannot exceed maximum marks.', true);
  try {
    const result = await api('/api/marks', { method: 'POST', body: JSON.stringify({
      roll_no: $('student').value, subject: $('subject').value.trim(),
      semester: $('semester').value, exam_type: $('examType').value,
      max_marks: max, marks_obtained: obtained
    }) });
    say(result.message);
    await loadMarks();
  } catch (error) { say(error.message, true); }
});
$('logoutButton').addEventListener('click', async () => {
  try { await api('/api/faculty/logout', { method: 'POST' }); } finally { window.location.href = 'faculty-login.html'; }
});
(async () => {
  try { await loadFaculty(); await loadBranches(); await loadStudents(); await loadMarks(); }
  catch (error) { say(error.message, true); }
})();
