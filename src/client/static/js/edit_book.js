document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram.WebApp;
  tg.ready();

  const token = window.appData?.token;

  if (!token) {
    alert("Вы не авторизованы");
    tg.close();
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('book_id');

  if (!bookId) {
    alert("Не указан ID книги");
    tg.close();
    return;
  }

  // Загрузка данных книги
  fetch(`https://yume-miniapp.ru/api/book/${bookId}`, {
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => res.json())
  .then(bookData => {
    document.getElementById("title").value = bookData.title;
    document.getElementById("author").value = bookData.author;
    document.getElementById("description").value = bookData.description;
    document.getElementById("previewImage").src = `https://yume-miniapp.ru/api/books/cover/${bookId}`;

    const stars = document.querySelectorAll('.rating-input span');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const value = parseInt(star.getAttribute('data-value'));
        stars.forEach(s => s.classList.toggle('active', s.getAttribute('data-value') <= value));
      });
    });

    for (let i = 0; i < Math.floor(bookData.rating); i++) {
      stars[i].classList.add('active');
    }
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

    fetch(`https://yume-miniapp.ru/api/books/${bookId}`, {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + token
      },
      body: formData
    })
    .then(res => res.json())
    .then(() => {
      tg.close();
    })
    .catch(err => {
      console.error("Ошибка:", err);
      alert("Ошибка при сохранении");
    });
  });
});