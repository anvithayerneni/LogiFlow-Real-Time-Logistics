from datetime import datetime
from typing import List, Optional
from sqlalchemy import DateTime, Float, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class DeliveryStatus:
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    ACCEPTED = "ACCEPTED"
    ARRIVED_AT_RESTAURANT = "ARRIVED_AT_RESTAURANT"
    PICKED_UP = "PICKED_UP"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

    ALL = [
        PENDING,
        ASSIGNED,
        ACCEPTED,
        ARRIVED_AT_RESTAURANT,
        PICKED_UP,
        IN_TRANSIT,
        DELIVERED,
        CANCELLED,
    ]


class Delivery(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "deliveries"

    order_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("orders.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    driver_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("drivers.id", ondelete="SET NULL"), index=True, nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(50), default=DeliveryStatus.PENDING, index=True, nullable=False
    )

    pickup_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    pickup_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    dropoff_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    dropoff_longitude: Mapped[float] = mapped_column(Float, nullable=False)

    estimated_pickup_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    estimated_delivery_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    actual_pickup_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    actual_delivery_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    distance_km: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="delivery")
    driver: Mapped[Optional["Driver"]] = relationship("Driver", back_populates="deliveries")
    tracking_breadcrumbs: Mapped[List["DriverLocation"]] = relationship(
        "DriverLocation", back_populates="delivery", order_by="DriverLocation.timestamp"
    )

    __table_args__ = (
        Index("idx_deliveries_driver_status", "driver_id", "status"),
        Index("idx_deliveries_status", "status"),
    )
