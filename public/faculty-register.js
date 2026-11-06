const form = document.getElementById("registerForm");
const message = document.getElementById("message");

form.addEventListener("submit", async function (e) {

    e.preventDefault();

    message.textContent = "Registering...";

    const faculty = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        department: document.getElementById("department").value,
        password: document.getElementById("password").value
    };

    try {

        const response = await fetch("/api/faculty/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(faculty)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Registration failed");
        }

        message.textContent = "Registration successful!";
        message.className = "message success";

        setTimeout(() => {
            window.location.href = "faculty-login.html";
        }, 1000);

    } catch (error) {

        message.textContent = error.message;
        message.className = "message error";

    }

});