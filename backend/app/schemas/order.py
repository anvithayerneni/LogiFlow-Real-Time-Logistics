from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class OrderItemCreate(BaseModel):
    menu_item_id: str
    quantity: int = Field(1, ge=1)
    special_instructions: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: str
    order_id: str
    menu_item_id: Optional[str] = None
    item_name: str
    unit_price: float
    quantity: int
    total_price: float
    special_instructions: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    restaurant_id: str
    delivery_address_id: Optional[str] = None
    items: List[OrderItemCreate] = Field(..., min_length=1)
    customer_notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str
    cancellation_reason: Optional[str] = None


class OrderResponse(BaseModel):
    id: str
    customer_id: str
    restaurant_id: str
    delivery_address_id: Optional[str] = None
    status: str
    subtotal: float
    delivery_fee: float
    tax: float
    total_amount: float
    customer_notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    estimated_prep_time_minutes: int
    estimated_delivery_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []

    # Optional denormalized details for client views
    restaurant_name: Optional[str] = None
    customer_name: Optional[str] = None
    delivery_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
