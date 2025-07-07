// Предпросмотр изображения
document.getElementById('bookImage')?.addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('preview').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});


document.addEventListener("DOMContentLoaded", function () {
  let selectedRating = 0;

  const stars = document.querySelectorAll('.rating-input span');

  stars.forEach(star => {
    star.addEventListener('click', () => {
      // Получаем значение выбранной звёздочки
      selectedRating = parseInt(star.getAttribute('data-value'));

      // Очистка всех активных
      stars.forEach(s => s.classList.remove('active'));

      // Активируем все до текущей
      stars.forEach((s, index) => {
        if (index < selectedRating) {
          s.classList.add('active');
        }
      });

      console.log("Выбран рейтинг:", selectedRating);
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

    fetch("http://127.0.0.1:8000/books", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
      },
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      window.location.href = "/client/templates/account.html";
    })
    .catch(err => {
      console.error("Ошибка:", err);
      alert("Ошибка при добавлении книги");
    });
  };
});