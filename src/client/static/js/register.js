document.getElementById("registerForm")?.addEventListener("submit", function (event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  fetch("http://127.0.0.1:8000/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, email, password }),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    localStorage.setItem("token", data.access_token);
    window.location.href = "/client/templates/account.html";
  })
  .catch(error => {
    console.error("Ошибка:", error);
    alert("Ошибка регистрации");
  });
});