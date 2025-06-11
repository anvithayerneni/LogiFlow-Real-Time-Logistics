from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class MenuItemCreate(BaseModel):
    category_id: Optional[str] = None
    name: str = Field(..., min_length=2)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    image_url: Optional[str] = None
    is_available: bool = True


class MenuItemUpdate(BaseModel):
    category_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    image_url: Optional[str] = None
    is_available: Optional[bool] = None


class MenuItemResponse(BaseModel):
    id: str
    restaurant_id: str
    category_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    is_available: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MenuCategoryCreate(BaseModel):
    name: str = Field(..., min_length=2)
    display_order: int = 0


class MenuCategoryResponse(BaseModel):
    id: str
    restaurant_id: str
    name: str
    display_order: int
    items: List[MenuItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class RestaurantCreate(BaseModel):
    name: str = Field(..., min_length=2)
    description: Optional[str] = None
    cuisine_type: str = "General"
    address: str
    phone: Optional[str] = None
    image_url: Optional[str] = None
    latitude: float
    longitude: float
    prep_time_minutes: int = 20


class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cuisine_type: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    prep_time_minutes: Optional[int] = None
    is_active: Optional[bool] = None


class RestaurantResponse(BaseModel):
    id: str
    owner_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    cuisine_type: str
    address: str
    phone: Optional[str] = None
    image_url: Optional[str] = None
    latitude: float
    longitude: float
    rating: float
    prep_time_minutes: int
    is_active: bool
    created_at: datetime
    categories: List[MenuCategoryResponse] = []
    menu_items: List[MenuItemResponse] = []

    model_config = ConfigDict(from_attributes=True)
