from sqlalchemy import Column, Integer, String, Float, LargeBinary, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    telegram_id = Column(Integer, unique=True, nullable=False)
    username = Column(String, nullable=True)
    first_name = Column(String)
    last_name = Column(String)

class Book(Base):
    __tablename__ = "books"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    author = Column(String)
    description = Column(String)
    rating = Column(Float)
    image = Column(LargeBinary)  # Хранение изображения в БД
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "author": self.author,
            "description": self.description,
            "rating": self.rating,
            "owner_id": self.owner_id
            # image НЕ возвращаем
        }