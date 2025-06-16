from typing import Optional
from sqlalchemy import Float, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class PaymentStatus:
    INITIATED = "INITIATED"
    AUTHORIZED = "AUTHORIZED"
    CAPTURED = "CAPTURED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"

    ALL = [INITIATED, AUTHORIZED, CAPTURED, FAILED, REFUNDED]


class Payment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "payments"

    order_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("orders.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), default=PaymentStatus.INITIATED, index=True, nullable=False
    )
    payment_method: Mapped[str] = mapped_column(String(50), default="credit_card", nullable=False)
    transaction_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    provider: Mapped[str] = mapped_column(
        String(50), default="MOCK_PAYMENT_GATEWAY", nullable=False
    )
    failure_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="payment")

    __table_args__ = (Index("idx_payments_order_status", "order_id", "status"),)
