from fastapi import (FastAPI, Depends, 
                     Form, File, 
                     UploadFile, 
                     HTTPException, 
                     Response,
                     status)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
import hashlib
import hmac
from jose import jwt
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from db.models import Book, User
from db.database import engine, Base, get_db
from config.config_reader import config

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origains=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    try:
        token = credentials.scheme + " " + credentials.credentials
        payload = jwt.decode(token, config.SECRET_KEY.get_secret_value(), algorithms=["HS256"])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Невалидный токен")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Ошибка декодирования токена")


def verify_telegram_data(data: dict):
    """Проверяет, что initData подписан корректно"""
    received_hash = data.pop("hash")
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
    secret_key = hashlib.sha256(config.BOT_TOKEN.encode()).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    return calculated_hash == received_hash


def create_access_token(user_id: int) -> str:
    """Создаёт JWT токен для пользователя"""
    expires = datetime.utcnow() + timedelta(hours=24)
    token = jwt.encode({"user_id": user_id, "exp": expires}, config.SECRET_KEY.get_secret_value(), algorithm="HS256")
    return token


@app.post("/auth/telegram")
async def auth_telegram(payload: dict, db: Session = Depends(get_db)):
    if not verify_telegram_data(payload):
        raise HTTPException(status_code=400, detail="Invalid Telegram data")

    telegram_user = payload.get("user")
    if not telegram_user:
        raise HTTPException(status_code=400, detail="User data missing")

    user_id = telegram_user["id"]
    username = telegram_user.get("username", f"user_{user_id}")
    first_name = telegram_user.get("first_name", "")
    last_name = telegram_user.get("last_name", "")

    # Пытаемся найти пользователя
    db_user = db.query(User).filter(User.telegram_id == user_id).first()
    
    if not db_user:
        # Создаем нового пользователя
        db_user = User(
            telegram_id=user_id,
            username=username,
            first_name=first_name,
            last_name=last_name,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    token = create_access_token(db_user.id)
    return {"token": token}


@app.get("/me")
def get_me(db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    user = db.query(User).get(user_id)
    return {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name
    }


@app.get("/book/{book_id}")
def get_book(book_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    book = db.query(Book).filter(Book.id == book_id, Book.owner_id == user_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")
    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "description": book.description,
        "rating": book.rating
    }


@app.delete("/books/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    book = db.query(Book).filter(Book.id == book_id, Book.owner_id == user_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")
    db.delete(book)
    db.commit()
    return {"status": "OK"}


@app.put("/books/{book_id}")
def update_book(
    book_id: int,
    title: str = Form(...),
    author: str = Form(...),
    description: str = Form(...),
    rating: float = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    book = db.query(Book).filter(Book.id == book_id, Book.owner_id == user_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")

    book.title = title
    book.author = author
    book.description = description
    book.rating = rating

    if image:
        book.image = image.file.read()

    db.commit()
    db.refresh(book)

    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "description": book.description,
        "rating": book.rating
    }


@app.get("/books/me")
def get_my_books(db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    books = db.query(Book).filter(Book.owner_id == user_id).all()
    return [{
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "description": book.description,
        "rating": book.rating
    } for book in books]


@app.get("/books/cover/{book_id}")
def get_book_cover(book_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    book = db.query(Book).filter(Book.id == book_id, Book.owner_id == user_id).first()
    if not book or not book.image:
        raise HTTPException(status_code=404, detail="Обложка не найдена")
    return Response(content=book.image, media_type="image/jpeg")


@app.post("/books")
def create_book(
    title: str = Form(...),
    author: str = Form(...),
    description: str = Form(...),
    rating: float = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    book = Book(
        title=title,
        author=author,
        description=description,
        rating=rating,
        image=image.file.read(),
        owner_id=user_id
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "description": book.description,
        "rating": book.rating
    }