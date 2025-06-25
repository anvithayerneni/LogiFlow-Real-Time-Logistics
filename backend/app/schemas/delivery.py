from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.driver import DriverResponse, DriverLocationResponse


class DeliveryStatusUpdate(BaseModel):
    status: str


class DeliveryAssignDriver(BaseModel):
    driver_id: str


class DeliveryResponse(BaseModel):
    id: str
    order_id: str
    driver_id: Optional[str] = None
    status: str
    pickup_latitude: float
    pickup_longitude: float
    dropoff_latitude: float
    dropoff_longitude: float
    estimated_pickup_time: Optional[datetime] = None
    estimated_delivery_time: Optional[datetime] = None
    actual_pickup_time: Optional[datetime] = None
    actual_delivery_time: Optional[datetime] = None
    distance_km: float
    created_at: datetime
    updated_at: datetime
    driver: Optional[DriverResponse] = None
    tracking_breadcrumbs: List[DriverLocationResponse] = []

    model_config = ConfigDict(from_attributes=True)
