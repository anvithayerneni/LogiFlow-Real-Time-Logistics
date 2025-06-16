from datetime import datetime
from typing import List, Optional
from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class OrderStatus:
    CREATED = "CREATED"
    CONFIRMED = "CONFIRMED"
    PREPARING = "PREPARING"
    READY_FOR_PICKUP = "READY_FOR_PICKUP"
    PICKED_UP = "PICKED_UP"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"

    ALL = [
        CREATED,
        CONFIRMED,
        PREPARING,
        READY_FOR_PICKUP,
        PICKED_UP,
        OUT_FOR_DELIVERY,
        DELIVERED,
        CANCELLED,
        REJECTED,
    ]


class Order(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "orders"

    customer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    restaurant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    delivery_address_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("addresses.id", ondelete="SET NULL"), nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(50), default=OrderStatus.CREATED, index=True, nullable=False
    )

    subtotal: Mapped[float] = mapped_column(Float, nullable=False)
    delivery_fee: Mapped[float] = mapped_column(Float, default=2.99, nullable=False)
    tax: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)

    customer_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cancellation_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    estimated_prep_time_minutes: Mapped[int] = mapped_column(Integer, default=20, nullable=False)
    estimated_delivery_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    customer: Mapped["User"] = relationship("User", back_populates="orders")
    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="orders")
    delivery_address: Mapped[Optional["Address"]] = relationship("Address")
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )
    delivery: Mapped[Optional["Delivery"]] = relationship(
        "Delivery", back_populates="order", uselist=False
    )
    payment: Mapped[Optional["Payment"]] = relationship(
        "Payment", back_populates="order", uselist=False
    )

    __table_args__ = (
        Index("idx_orders_customer_status", "customer_id", "status"),
        Index("idx_orders_restaurant_status", "restaurant_id", "status"),
        Index("idx_orders_created_at", "created_at"),
    )


class OrderItem(Base, UUIDMixin):
    __tablename__ = "order_items"

    order_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False
    )
    menu_item_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("menu_items.id", ondelete="SET NULL"), nullable=True
    )
    item_name: Mapped[str] = mapped_column(String(255), nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    special_instructions: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="items")
    menu_item: Mapped[Optional["MenuItem"]] = relationship("MenuItem")
