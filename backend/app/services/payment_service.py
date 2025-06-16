import asyncio
import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.logging import logger
from app.models.payment import Payment, PaymentStatus


class MockPaymentService:
    """
    Simulated Payment Processing Provider.

    WARNING: For development, testing, and portfolio demonstrations only.
    No actual financial transactions or payment networks are contacted.
    """

    @staticmethod
    async def process_payment(
        db: AsyncSession,
        order_id: str,
        amount: float,
        payment_method: str = "credit_card",
        card_number: Optional[str] = "4242424242424242",
    ) -> Payment:
        logger.info(f"[SIMULATED PAYMENT] Processing payment of ${amount:.2f} for order {order_id}")

        # Artificial latency for realism
        if settings.MOCK_PAYMENT_DELAY_SECONDS > 0:
            await asyncio.sleep(settings.MOCK_PAYMENT_DELAY_SECONDS)

        # Check for simulated test failure pattern (e.g. card ending in 9999)
        is_failure_trigger = card_number and card_number.endswith("9999")

        transaction_id = f"txn_mock_{uuid.uuid4().hex[:16]}"

        if is_failure_trigger:
            payment = Payment(
                order_id=order_id,
                amount=amount,
                currency="USD",
                status=PaymentStatus.FAILED,
                payment_method=payment_method,
                transaction_id=transaction_id,
                provider="SIMULATED_MOCK_PAYMENT_GATEWAY",
                failure_reason="Simulated card decline: insufficient funds (test code 9999)",
            )
        else:
            # Successful capture
            payment = Payment(
                order_id=order_id,
                amount=amount,
                currency="USD",
                status=PaymentStatus.CAPTURED,
                payment_method=payment_method,
                transaction_id=transaction_id,
                provider="SIMULATED_MOCK_PAYMENT_GATEWAY",
            )

        db.add(payment)
        await db.commit()
        await db.refresh(payment)
        return payment

    @staticmethod
    async def refund_payment(db: AsyncSession, order_id: str) -> Optional[Payment]:
        """Simulates issuing a full refund for an order."""
        result = await db.execute(select(Payment).where(Payment.order_id == order_id))
        payment = result.scalar_one_or_none()
        if not payment:
            return None

        logger.info(
            f"[SIMULATED PAYMENT] Refunding transaction {payment.transaction_id} for order {order_id}"
        )
        payment.status = PaymentStatus.REFUNDED
        await db.commit()
        await db.refresh(payment)
        return payment


payment_service = MockPaymentService()
