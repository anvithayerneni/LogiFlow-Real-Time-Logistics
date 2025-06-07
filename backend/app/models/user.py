from typing import List, Optional
from sqlalchemy import Boolean, Float, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class UserRole:
    CUSTOMER = "CUSTOMER"
    RESTAURANT = "RESTAURANT"
    DELIVERY_DRIVER = "DELIVERY_DRIVER"
    ADMIN = "ADMIN"


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    role: Mapped[str] = mapped_column(
        String(50), default=UserRole.CUSTOMER, index=True, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    addresses: Mapped[List["Address"]] = relationship(
        "Address", back_populates="user", cascade="all, delete-orphan"
    )
    driver_profile: Mapped[Optional["Driver"]] = relationship(
        "Driver", back_populates="user", uselist=False
    )
    restaurants: Mapped[List["Restaurant"]] = relationship("Restaurant", back_populates="owner")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="customer")
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="user"
    )


class Address(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "addresses"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    label: Mapped[str] = mapped_column(String(100), default="Home")  # Home, Work, etc.
    street: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="addresses")

    __table_args__ = (Index("idx_addresses_coords", "latitude", "longitude"),)
