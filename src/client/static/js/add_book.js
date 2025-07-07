document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram.WebApp;
  tg.ready();

  const token = window.appData?.token;

  if (!token) {
    alert("Вы не авторизованы");
    tg.close();
    return;
  }

  let selectedRating = 0;
  const stars = document.querySelectorAll('.rating-input span');

  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.getAttribute('data-value'));
      stars.forEach(s => s.classList.remove('active'));
      stars.forEach((s, index) => {
        if (index < selectedRating) s.classList.add('active');
      });
    });
  });

  window.saveBook = function () {
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const description = document.getElementById('description').value;
    const imageInput = document.getElementById('bookImage');
    const image = imageInput.files[0];

    if (!title || !author || !description || !image || selectedRating === 0) {
      alert("Заполните все поля и выберите рейтинг");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("author", author);
    formData.append("description", description);
    formData.append("rating", selectedRating);
    formData.append("image", image);

    fetch("https://yume-miniapp.ru/api/books", {
      method: "POST",
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
      alert("Ошибка при добавлении книги");
    });
  };
});