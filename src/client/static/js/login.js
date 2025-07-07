document.getElementById("loginForm")?.addEventListener("submit", function (event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Пример отправки данных на бэкенд
  fetch("http://127.0.0.1:8000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      localStorage.setItem("token", data.access_token);
      window.location.href = "/client/templates/account.html"; // Перенаправление на главную
    })
    .catch((error) => {
      console.error("Ошибка:", error);
      alert("Ошибка входа");
    });
});