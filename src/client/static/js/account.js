document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const usernameElement = document.getElementById("username");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!token) {
    alert("Вы не авторизованы");
    window.location.href = "/client/templates/login.html";
    return;
  }

  // Функция для выхода
  function logout() {
    localStorage.removeItem("token");
    window.location.href = "/client/templates/index.html"; // или login.html
  }

  // Обработчик клика по кнопке "Выйти"
  logoutBtn.addEventListener("click", logout);

  // Получаем имя пользователя с бэкенда
  fetch("http://127.0.0.1:8000/me", {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => {
    if (res.status === 401) {
      throw new Error("Сессия истекла");
    }
    return res.json();
  })
  .then(userData => {
    usernameElement.textContent = userData.username;
  })
  .catch(err => {
    console.error("Ошибка загрузки профиля:", err);
    alert("Ошибка: " + err.message);
    logout(); // Автоматический выход при ошибке
  });

  // Код для книг
  fetch("http://127.0.0.1:8000/books/me", {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token,
    }
  })
  .then(res => {
    if (res.status === 401) {
      alert("Сессия истекла");
      localStorage.removeItem("token");
      window.location.href = "/client/templates/login.html";
      return;
    }
    return res.json();
  })
  .then(books => {
    console.log("Полученные данные:", books);
    const container = document.getElementById("bookList");

    container.innerHTML = "";


    books.forEach(book => {
      const card = document.createElement("div");
      card.className = "book-card";
      
      const img = document.createElement("img");
      img.src = `http://127.0.0.1:8000/books/cover/${book.id}`;
      img.alt = "Обложка книги";
      img.className = "book-image";

      const title = document.createElement("h3")
      title.className = "book-title";
      title.textContent = book.title;

      const author = document.createElement("p");
      author.className = "book-author";
      author.textContent = book.author;

      // При клике вызываем openBookDetails
      card.addEventListener("click", () =>
        openBookDetails(
          book.id,
          book.title,
          book.author,
          book.description,
          "⭐".repeat(book.rating)
        )
      );

      // Собираем карточку
      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(author);

      // Добавляем в контейнер
      container.appendChild(card);
    });

    // Добавляем карточку с плюсиком в конец
    const addCard = document.createElement("div");
    addCard.className = "add-card";
    addCard.textContent = "+";
    addCard.onclick = () => {
      window.location.href = "/client/templates/add_book.html";
    };
    container.appendChild(addCard);
  })
  .catch(err => console.error("Ошибка:", err));
});

let currentBookId = null;
// Функция открытия модального окна с информацией о книге
function openBookDetails(id, title, author, description, rating) {
  currentBookId = id;

  const modalImage = document.getElementById('modal-image');
  modalImage.src = `http://127.0.0.1:8000/books/cover/${id}`;

  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-author').textContent = author;
  document.getElementById('modal-description').textContent = description;
  document.getElementById('modal-rating').innerHTML = rating;

  document.getElementById('modal').style.display = 'block';
}

// Закрытие модального окна
function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

// Закрытие при клике вне области окна
window.onclick = function(event) {
  const modal = document.getElementById('modal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
}

// Кнопка "Редактировать"
document.getElementById("editBookBtn").onclick = () => {
  if (currentBookId) {
    window.location.href = `/client/templates/edit_book.html?book_id=${currentBookId}`;
  }
};

// Кнопка "Удалить"
document.getElementById("deleteBookBtn").onclick = () => {
  if (!currentBookId) return;

  const confirmDelete = confirm("Вы уверены, что хотите удалить эту книгу?");
  if (confirmDelete) {
    fetch(`http://127.0.0.1:8000/books/${currentBookId}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
      }
    })
    .then(res => {
      if (res.ok) {
        location.reload(); // Перезагрузка страницы для обновления списка
      } else {
        alert("Ошибка при удалении");
      }
    })
    .catch(err => {
      console.error("Ошибка:", err);
      alert("Произошла ошибка");
    });
  }
};