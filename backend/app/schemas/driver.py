from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class DriverCreate(BaseModel):
    vehicle_type: str = "car"  # car, bicycle, scooter
    license_plate: Optional[str] = None


class DriverUpdate(BaseModel):
    vehicle_type: Optional[str] = None
    license_plate: Optional[str] = None
    is_available: Optional[bool] = None


class DriverLocationUpdate(BaseModel):
    delivery_id: Optional[str] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    speed: Optional[float] = None
    heading: Optional[float] = None
    timestamp: Optional[datetime] = None


class DriverLocationResponse(BaseModel):
    id: str
    driver_id: str
    delivery_id: Optional[str] = None
    latitude: float
    longitude: float
    speed: Optional[float] = None
    heading: Optional[float] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class DriverResponse(BaseModel):
    id: str
    user_id: str
    vehicle_type: str
    license_plate: Optional[str] = None
    is_available: bool
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    last_location_update: Optional[datetime] = None
    rating: float
    active_deliveries_count: int
    created_at: datetime
    # Nested user details if joined
    full_name: Optional[str] = None
    phone: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
