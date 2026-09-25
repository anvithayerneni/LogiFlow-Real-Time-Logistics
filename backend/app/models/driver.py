from datetime import datetime
from typing import List, Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin, utc_now


class Driver(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "drivers"

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    vehicle_type: Mapped[str] = mapped_column(
        String(50), default="car", nullable=False
    )  # car, scooter, bicycle
    license_plate: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)
    current_latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    current_longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    last_location_update: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    rating: Mapped[float] = mapped_column(Float, default=4.9, nullable=False)
    active_deliveries_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="driver_profile")
    deliveries: Mapped[List["Delivery"]] = relationship("Delivery", back_populates="driver")
    locations: Mapped[List["DriverLocation"]] = relationship(
        "DriverLocation", back_populates="driver", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index(
            "idx_drivers_availability_coords",
            "is_available",
            "current_latitude",
            "current_longitude",
        ),
    )


class DriverLocation(Base, UUIDMixin):
    __tablename__ = "driver_locations"

    driver_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("drivers.id", ondelete="CASCADE"), index=True, nullable=False
    )
    delivery_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("deliveries.id", ondelete="SET NULL"), index=True, nullable=True
    )
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    speed: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # km/h
    heading: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # degrees 0-360
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, index=True, nullable=False
    )

    driver: Mapped["Driver"] = relationship("Driver", back_populates="locations")
    delivery: Mapped[Optional["Delivery"]] = relationship(
        "Delivery", back_populates="tracking_breadcrumbs"
    )

    __table_args__ = (Index("idx_driver_locations_driver_time", "driver_id", "timestamp"),)
