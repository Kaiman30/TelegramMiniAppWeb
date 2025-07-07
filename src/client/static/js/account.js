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
  fetch("https://yume-miniapp.ru/api/auth/telegram ", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      initData: tg.initData,
      user: user
    })
  })
  .then(res => {
    if (!res.ok) {
      throw new Error("Ошибка авторизации");
    }
    return res.json();
  })
  .then(data => {
    const token = data.token;

    // Сохраняем токен в памяти (не в localStorage)
    window.appData = { token };

    // Получаем имя пользователя
    return fetch("https://yume-miniapp.ru/api/me ", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });
  })
  .then(res => {
    if (!res.ok) {
      throw new Error("Ошибка получения данных пользователя");
    }
    return res.json();
  })
  .then(userData => {
    document.getElementById("username").textContent = userData.username || `${userData.first_name} ${userData.last_name || ''}`;

    // Загружаем книги
    return fetch("https://yume-miniapp.ru/api/books/me ", {
      headers: {
        "Authorization": "Bearer " + window.appData.token
      }
    });
  })
  .then(res => {
    if (!res.ok) {
      throw new Error("Ошибка загрузки книг");
    }
    return res.json();
  })
  .then(books => {
    const container = document.getElementById("bookList");
    container.innerHTML = "";

    books.forEach(book => {
      const card = document.createElement("div");
      card.className = "book-card";
      const img = document.createElement("img");
      img.src = `https://yume-miniapp.ru/api/books/cover/ ${book.id}`;
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
      window.location.href = "../../add_book.html";
    };
    container.appendChild(addCard);
  })
  .catch(err => {
    console.error("Ошибка:", err);
    alert("Не удалось войти через Telegram");
    tg.close();
  });
});

// --- Модальное окно ---
let currentBookId = null;

function openBookDetails(id, title, author, description, rating) {
  currentBookId = id;
  document.getElementById('modal-image').src = `https://yume-miniapp.ru/api/books/cover/${id}`;
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-author').textContent = author;
  document.getElementById('modal-description').textContent = description;
  document.getElementById('modal-rating').innerHTML = rating;
  document.getElementById('modal').style.display = 'block';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

window.onclick = function(event) {
  const modal = document.getElementById('modal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};

document.getElementById("editBookBtn").onclick = () => {
  if (currentBookId) {
    window.location.href = `edit_book.html?book_id=${currentBookId}`;
  }
};

document.getElementById("deleteBookBtn").onclick = () => {
  if (!currentBookId) return;
  const confirmDelete = confirm("Вы уверены, что хотите удалить эту книгу?");
  if (confirmDelete) {
    fetch(`https://yume-miniapp.ru/api/books/ ${currentBookId}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + window.appData?.token
      }
    })
    .then(res => {
      if (res.ok) location.reload();
      else alert("Ошибка при удалении");
    })
    .catch(err => {
      console.error("Ошибка:", err);
      alert("Произошла ошибка");
    });
  }
};