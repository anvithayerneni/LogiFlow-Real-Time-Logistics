from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class PaymentCreate(BaseModel):
    order_id: str
    payment_method: str = "credit_card"
    card_number: Optional[str] = "4242424242424242"


class PaymentResponse(BaseModel):
    id: str
    order_id: str
    amount: float
    currency: str
    status: str
    payment_method: str
    transaction_id: Optional[str] = None
    provider: str
    failure_reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
