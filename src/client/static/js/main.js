// Функция открытия модального окна с информацией о книге
function openBookDetails(title, author, description, rating) {
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