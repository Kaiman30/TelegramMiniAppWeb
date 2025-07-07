document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram.WebApp;
  tg.ready();

  const user = tg.initDataUnsafe?.user;

  if (!user) {
    alert("Вы не авторизованы через Telegram");
    tg.close();
    return;
  }

  // Отправляем данные пользователя на бэкенд
  fetch("http://127.0.0.1:8000/auth/telegram", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      initData: tg.initData,
      user: user
    })
  })
  .then(res => res.json())
  .then(data => {
    const token = data.token;

    // Сохраняем токен в памяти (не в localStorage)
    window.appData = { token };

    // Загружаем имя пользователя
    document.getElementById("username").textContent = user.username || `${user.first_name} ${user.last_name || ''}`;

    // Загрузка книг
    fetch("http://127.0.0.1:8000/books/me", {
      headers: {
        "Authorization": "Bearer " + token
      }
    })
    .then(res => res.json())
    .then(books => {
      const container = document.getElementById("bookList");
      container.innerHTML = "";

      books.forEach(book => {
        const card = document.createElement("div");
        card.className = "book-card";
        const img = document.createElement("img");
        img.src = `http://127.0.0.1:8000/books/cover/${book.id}`;
        img.alt = "Обложка книги";
        img.className = "book-image";

        const title = document.createElement("h3");
        title.className = "book-title";
        title.textContent = book.title;

        const author = document.createElement("p");
        author.className = "book-author";
        author.textContent = book.author;

        card.addEventListener("click", () =>
          openBookDetails(
            book.id,
            book.title,
            book.author,
            book.description,
            "⭐".repeat(book.rating)
          )
        );

        card.appendChild(img);
        card.appendChild(title);
        card.appendChild(author);

        container.appendChild(card);
      });

      // Кнопка добавления
      const addCard = document.createElement("div");
      addCard.className = "add-card";
      addCard.textContent = "+";
      addCard.onclick = () => {
        window.location.href = "/client/add_book.html";
      };
      container.appendChild(addCard);
    });
  })
  .catch(err => {
    console.error("Ошибка авторизации:", err);
    alert("Не удалось войти");
  });

  // Обработчик кнопки закрытия
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    tg.close();
  });
});