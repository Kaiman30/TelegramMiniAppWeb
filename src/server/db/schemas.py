from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    
class UserOut(BaseModel):
    id: int
    username: str
    email: str
    
class UserLogin(BaseModel):
    username: str
    password: str
    
class BookCreate(BaseModel):
    pass
    
class BookBase(BaseModel):
    title: str
    author: str
    description: str
    rating: float

    
class BookOut(BookCreate):
    id: int
    title: str
    author: str
    description: str
    rating: float
    
    class Config:
        from_attributes = True
    
class Token(BaseModel):
    access_token: str
    token_type: str
    
class TokenData(BaseModel):
    username: Optional[str] = None