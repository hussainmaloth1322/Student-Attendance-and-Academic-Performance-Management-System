
document.addEventListener("DOMContentLoaded", function () {

    // Get faculty name
    const facultyName = localStorage.getItem("facultyName");

    const welcome = document.getElementById("facultyWelcome");

    if (facultyName && welcome) {
        welcome.textContent = "Welcome, " + facultyName + "!";
    }

    // Show login or logout link
    const loginLink = document.getElementById("loginLink");
    const logoutLink = document.getElementById("logoutLink");

    if (facultyName) {
        if (loginLink) loginLink.style.display = "none";
        if (logoutLink) logoutLink.style.display = "inline";
    }

    // Display current date
    const dateElement = document.getElementById("currentDate");

    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );
    }

    // Load total students from backend
    loadDashboardStats();

});


// Load dashboard statistics
async function loadDashboardStats() {

    try {
        const response = await fetch("/api/dashboard");

        if (!response.ok) {
            throw new Error("Dashboard data could not be loaded");
        }

        const data = await response.json();

        document.getElementById("totalStudents").textContent =
            data.totalStudents ?? "—";

        document.getElementById("attendanceCount").textContent =
            data.attendanceToday ?? "—";

    } catch (error) {
        console.error("Dashboard error:", error);
    }

}


// Logout function
function logout() {

    localStorage.removeItem("facultyName");
    localStorage.removeItem("facultyEmail");

    window.location.href = "faculty-login.html";

}
