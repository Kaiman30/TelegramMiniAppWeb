from fastapi import FastAPI, Depends, Form, File, UploadFile, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
import uvicorn


from sqlalchemy.orm import Session

from db.models import Book, User
from db.database import engine, Base, get_db
from services.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_password_hash
)
from db.schemas import (
    UserCreate,
    Token,
    UserLogin,
    BookOut
)
from config.config_reader import config

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # можно заменить на домен твоего фронтенда
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
Base.metadata.create_all(bind=engine)


@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username taken")
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created"}


@app.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = authenticate_user(db, user.username, user.password)
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token({"sub": db_user.username})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/book/{book_id}")
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    result = {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "description": book.description,
        "rating": book.rating
        }
    return result


@app.delete("/books/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db)):
    db.query(Book).filter(Book.id == book_id).delete()
    db.commit()
    
    return {"status": "OK"}
    


@app.put("/books/{book_id}")
def update_book(
    book_id: int,
    title: str = Form(...),
    author: str = Form(...),
    description: str = Form(...),
    rating: float = Form(...),
    image: UploadFile = File(None),  # Можно не менять изображение
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")

    # Обновляем данные
    book.title = title
    book.author = author
    book.description = description
    book.rating = rating

    if image:
        book.image = image.file.read()

    db.commit()
    db.refresh(book)

    result = {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "description": book.description,
        "rating": book.rating
        }
    return result


@app.get("/books/me", response_model=list[BookOut])
def get_my_books(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    books = db.query(Book).filter(Book.owner_id == user.id).all()
    result = [
        {
            "id": book.id,
            "title": book.title,
            "author": book.author,
            "description": book.description,
            "rating": book.rating
        }
        for book in books
    ]
    return result

@app.get("/books/cover/{book_id}")
def get_book_cover(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).get(book_id)
    if not book or not book.image:
        raise HTTPException(status_code=404, detail="Image not found")
    return Response(content=book.image, media_type="image/jpeg")

@app.post("/books")
def create_book(
    title: str = Form(...),
    author: str = Form(...),
    description: str = Form(...),
    rating: float = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):    
    book = Book(
        title=title,
        author=author,
        description=description,
        rating=rating,
        image=image.file.read(),
        owner_id=current_user.id
    )
    
    db.add(book)
    db.commit()
    db.refresh(book)
    
    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "description": book.description,
        "rating": book.rating,
        "owner_id": book.owner_id     
    }

@app.get("/me")
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {
        "username": user.username,
        "email": user.email
    }


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)