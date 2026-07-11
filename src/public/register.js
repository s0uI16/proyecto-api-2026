function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function handleRegister(event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const message = document.getElementById("message");

  message.textContent = "";
  message.className = "";

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": getCsrfToken() ?? "",
      },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      message.textContent = data.error || "Error al registrarse.";
      message.className = "error";
      return;
    }

    message.textContent = "Cuenta creada. Ya puedes iniciar sesión.";
    message.className = "success";
    document.getElementById("registerForm").reset();
  } catch {
    message.textContent = "Error de red al registrarse.";
    message.className = "error";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("registerForm").addEventListener("submit", handleRegister);
});
