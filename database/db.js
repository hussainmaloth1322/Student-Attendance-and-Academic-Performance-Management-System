const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = __dirname;
fs.mkdirSync(dbDir, { recursive: true });
const dbPath = process.env.DB_PATH || path.join(dbDir, 'attendance.db');
const connection = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => connection.run(sql, params, function (err) {
    if (err) reject(err); else resolve({ lastID: this.lastID, changes: this.changes });
  }));
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => connection.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => connection.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));
}

async function init() {
  await run('PRAGMA foreign_keys = ON');
  await run(`CREATE TABLE IF NOT EXISTS faculty (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await run(`CREATE TABLE IF NOT EXISTS students (
    roll_no TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT ''
  )`);
  await run(`CREATE TABLE IF NOT EXISTS marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roll_no TEXT NOT NULL,
    subject TEXT NOT NULL,
    semester TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    max_marks REAL NOT NULL CHECK(max_marks > 0),
    marks_obtained REAL NOT NULL CHECK(marks_obtained >= 0 AND marks_obtained <= max_marks),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(roll_no, subject, semester, exam_type),
    FOREIGN KEY(roll_no) REFERENCES students(roll_no) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roll_no TEXT NOT NULL,
    attendance_date TEXT NOT NULL,
    period INTEGER NOT NULL CHECK(period BETWEEN 1 AND 7),
    status TEXT NOT NULL CHECK(status IN ('Present','Absent')),
    UNIQUE(roll_no, attendance_date, period),
    FOREIGN KEY(roll_no) REFERENCES students(roll_no) ON DELETE CASCADE
  )`);
  const count = await get('SELECT COUNT(*) AS count FROM students');
  if (count.count === 0) {
    const seed = [
      ['STU001', 'Aarav Kumar', 'CSE (AI & ML)'],
      ['STU002', 'Ananya Reddy', 'CSE (AI & ML)'],
      ['STU003', 'Rahul Sharma', 'CSE (AI & ML)']
    ];
    for (const student of seed) await run('INSERT INTO students(roll_no,name,department) VALUES(?,?,?)', student);
  }
}
async function getStudents(department = '') {
  if (department) return all('SELECT roll_no, name, department FROM students WHERE department=? ORDER BY roll_no', [department]);
  return all('SELECT roll_no, name, department FROM students ORDER BY department, roll_no');
}
async function createFaculty(f) {
  await run('INSERT INTO faculty(name,email,department,password_hash) VALUES(?,?,?,?)', [f.name,f.email,f.department,f.password_hash]);
  return { name:f.name, email:f.email, department:f.department };
}
async function getFacultyByEmail(email) { return get('SELECT id,name,email,department,password_hash FROM faculty WHERE email=?', [email]); }
async function addStudent(s) {
  await run('INSERT INTO students(roll_no,name,department) VALUES(?,?,?)', [s.roll_no, s.name, s.department || '']);
  return { roll_no: s.roll_no, name: s.name, department: s.department || '' };
}
async function updateStudent(rollNo, name, department) {
  const result = await run('UPDATE students SET name=?, department=? WHERE roll_no=?', [name, department || '', rollNo]);
  return result.changes > 0;
}
async function deleteStudent(rollNo) {
  await run('DELETE FROM attendance WHERE roll_no=?', [rollNo]);
  await run('DELETE FROM marks WHERE roll_no=?', [rollNo]);
  const result = await run('DELETE FROM students WHERE roll_no=?', [rollNo]);
  return result.changes > 0;
}
async function getAttendance(date, department = '') {
  const students = await getStudents(department);
  const records = await all('SELECT roll_no, attendance_date, period, status FROM attendance WHERE attendance_date=?', [date]);
  const byKey = new Map(records.map(r => [`${r.roll_no}-${r.period}`, r.status]));
  return students.map(s => ({
    ...s,
    periods: Array.from({ length: 7 }, (_, i) => byKey.get(`${s.roll_no}-${i + 1}`) || '')
  }));
}
async function saveAttendance(date, records) {
  await run('BEGIN TRANSACTION');
  try {
    for (const r of records) {
      const exists = await get('SELECT roll_no FROM students WHERE roll_no=?', [r.roll_no]);
      if (!exists) throw new Error(`Unknown student roll number: ${r.roll_no}`);
      await run(`INSERT INTO attendance(roll_no, attendance_date, period, status) VALUES(?,?,?,?)
        ON CONFLICT(roll_no, attendance_date, period) DO UPDATE SET status=excluded.status`,
        [r.roll_no, date, Number(r.period), r.status]);
    }
    await run('COMMIT');
  } catch (e) {
    await run('ROLLBACK');
    throw e;
  }
}
async function getMonthlyReport(month, threshold = 75, department = '') {
  const start = `${month}-01`;
  const nextDate = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1);
  const end = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-01`;
  const students = await getStudents(department);
  const rows = await all(`SELECT roll_no,
      SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) AS present,
      SUM(CASE WHEN status='Absent' THEN 1 ELSE 0 END) AS absent,
      COUNT(*) AS recorded
    FROM attendance WHERE attendance_date >= ? AND attendance_date < ?
    GROUP BY roll_no`, [start, end]);
  const counts = new Map(rows.map(r => [r.roll_no, r]));
  return students.map(s => {
    const c = counts.get(s.roll_no) || { present: 0, absent: 0, recorded: 0 };
    const present = Number(c.present || 0);
    const absent = Number(c.absent || 0);
    const working = present + absent;
    const percentage = working ? Number((present / working * 100).toFixed(2)) : 0;
    return { ...s, working_periods: working, present, absent, percentage, shortage: working > 0 && percentage < threshold };
  });
}

async function saveMarks(record) {
  const student = await get('SELECT roll_no FROM students WHERE roll_no=?', [record.roll_no]);
  if (!student) throw new Error(`Unknown student roll number: ${record.roll_no}`);
  await run(`INSERT INTO marks(roll_no, subject, semester, exam_type, max_marks, marks_obtained)
    VALUES(?,?,?,?,?,?)
    ON CONFLICT(roll_no, subject, semester, exam_type)
    DO UPDATE SET max_marks=excluded.max_marks, marks_obtained=excluded.marks_obtained, updated_at=CURRENT_TIMESTAMP`,
    [record.roll_no, record.subject, record.semester, record.exam_type, record.max_marks, record.marks_obtained]);
  return get(`SELECT m.*, s.name, s.department FROM marks m
    JOIN students s ON s.roll_no=m.roll_no
    WHERE m.roll_no=? AND m.subject=? AND m.semester=? AND m.exam_type=?`,
    [record.roll_no, record.subject, record.semester, record.exam_type]);
}
async function getMarks(department = '', rollNo = '') {
  let sql = `SELECT m.*, s.name, s.department FROM marks m
    JOIN students s ON s.roll_no=m.roll_no`;
  const conditions = [], params = [];
  if (department) { conditions.push('s.department=?'); params.push(department); }
  if (rollNo) { conditions.push('m.roll_no=?'); params.push(rollNo); }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY s.department, m.roll_no, m.semester, m.subject';
  return all(sql, params);
}
async function getDepartments() {
  const rows = await all("SELECT DISTINCT department FROM students WHERE department <> '' ORDER BY department");
  return rows.map(row => row.department);
}
module.exports = {
  init, getStudents, addStudent, updateStudent, deleteStudent, createFaculty, getFacultyByEmail,
  getAttendance, saveAttendance, getMonthlyReport,
  saveMarks, getMarks, getDepartments
};
