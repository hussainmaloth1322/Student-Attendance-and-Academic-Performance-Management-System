
document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    try {
        const response = await fetch("/api/faculty/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (!response.ok) {
            message.style.color = "red";
            message.textContent = result.error || "Login failed.";
            return;
        }

        message.style.color = "green";
        message.textContent = "Login successful!";

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);

    } catch (error) {
        message.style.color = "red";
        message.textContent = "Server connection failed.";
    }
});
