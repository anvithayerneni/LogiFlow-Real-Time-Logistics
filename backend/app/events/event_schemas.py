import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class BaseEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    timestamp: str = Field(default_factory=utc_now_iso)
    correlation_id: Optional[str] = None
    payload: Dict[str, Any]


class OrderCreatedEvent(BaseEvent):
    event_type: str = "order.created"


class OrderAcceptedEvent(BaseEvent):
    event_type: str = "order.accepted"


class OrderRejectedEvent(BaseEvent):
    event_type: str = "order.rejected"


class OrderReadyEvent(BaseEvent):
    event_type: str = "order.ready"


class DeliveryCreatedEvent(BaseEvent):
    event_type: str = "delivery.created"


class DeliveryAssignedEvent(BaseEvent):
    event_type: str = "delivery.assigned"


class DeliveryStatusChangedEvent(BaseEvent):
    event_type: str = "delivery.status_changed"


class DriverLocationUpdatedEvent(BaseEvent):
    event_type: str = "driver.location.updated"


class NotificationCreatedEvent(BaseEvent):
    event_type: str = "notification.created"
