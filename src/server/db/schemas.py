from pydantic import BaseModel
from typing import Optional

from pydantic import BaseModel

class TokenResponse(BaseModel):
    token: str