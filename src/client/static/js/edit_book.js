document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('book_id');

  if (!bookId) {
    alert("Не указан ID книги");
    window.location.href = "/client/templates/account.html";
    return;
  }

  // Загрузка данных книги
  fetch(`http://127.0.0.1:8000/book/${bookId}`, {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + localStorage.getItem("token")
    }
  })
  .then(res => {
    if (res.status === 401) {
      throw new Error("Сессия истекла");
    }
    return res.json();
  })
  .then(bookData => {
    // Предзаполнение полей
    document.getElementById("title").value = bookData.title;
    document.getElementById("author").value = bookData.author;
    document.getElementById("description").value = bookData.description;

    // Установка обложки
    document.getElementById("previewImage").src = `http://127.0.0.1:8000/books/cover/${bookId}`;

    // Установка рейтинга
    const stars = document.querySelectorAll('.rating-input span');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const value = parseInt(star.getAttribute('data-value'));
        stars.forEach(s => s.classList.toggle('active', s.getAttribute('data-value') <= value));
      });
    });

    // Установка активного рейтинга
    const ratingStars = document.querySelectorAll('.rating-input span');
    ratingStars.forEach(star => {
      star.classList.remove('active');
    });
    for (let i = 0; i < Math.floor(bookData.rating); i++) {
      ratingStars[i].classList.add('active');
    }
  })
  .catch(err => {
    console.error("Ошибка загрузки книги:", err);
    alert("Ошибка: " + err.message);
    window.location.href = "/client/templates/account.html";
  });

  // Обработка формы
  document.getElementById("editBookForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const title = document.getElementById("title").value;
    const author = document.getElementById("author").value;
    const description = document.getElementById("description").value;
    const imageInput = document.getElementById("bookImage");
    const selectedRating = Array.from(document.querySelectorAll('.rating-input span.active')).length;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("author", author);
    formData.append("description", description);
    formData.append("rating", selectedRating);

    if (imageInput.files.length > 0) {
      formData.append("image", imageInput.files[0]);
    }

    fetch(`http://127.0.0.1:8000/books/${bookId}`, {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
      },
      body: formData
    })
    .then(res => {
      if (!res.ok) {
        throw new Error("Ошибка сервера");
      }
      return res.json();
    })
    .then(data => {
      window.location.href = "/client/templates/account.html";
    })
    .catch(err => {
      console.error("Ошибка:", err);
      alert("Произошла ошибка при сохранении книги");
    });
  });
});