from typing import Optional
from sqlalchemy import Boolean, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class NotificationType:
    ORDER_STATUS = "ORDER_STATUS"
    DRIVER_ASSIGNED = "DRIVER_ASSIGNED"
    DELIVERY_UPDATE = "DELIVERY_UPDATE"
    PAYMENT = "PAYMENT"
    SYSTEM = "SYSTEM"


class Notification(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "notifications"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(
        String(50), default=NotificationType.SYSTEM, index=True, nullable=False
    )
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON payload string

    user: Mapped["User"] = relationship("User", back_populates="notifications")

    __table_args__ = (Index("idx_notifications_user_unread", "user_id", "is_read"),)
