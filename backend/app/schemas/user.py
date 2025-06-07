from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    phone: Optional[str] = None
    role: str = "CUSTOMER"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AddressCreate(BaseModel):
    label: str = "Home"
    street: str
    city: str
    state: str
    postal_code: str
    latitude: float
    longitude: float
    is_default: bool = False


class AddressResponse(BaseModel):
    id: str
    user_id: str
    label: str
    street: str
    city: str
    state: str
    postal_code: str
    latitude: float
    longitude: float
    is_default: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
