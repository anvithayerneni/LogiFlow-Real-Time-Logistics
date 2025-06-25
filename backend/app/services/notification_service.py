import json
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger
from app.models.notification import Notification, NotificationType
from app.websockets.connection_manager import ws_manager


class MockEmailProvider:
    """Mock Email provider that logs simulated email dispatches cleanly."""

    @staticmethod
    def send_email(to_email: str, subject: str, body_text: str) -> None:
        logger.info(
            f"\n--- [SIMULATED EMAIL DISPATCH] ---\n"
            f"To: {to_email}\n"
            f"Subject: {subject}\n"
            f"Content: {body_text}\n"
            f"----------------------------------"
        )


class NotificationService:
    def __init__(self):
        self.email_provider = MockEmailProvider()

    async def create_notification(
        self,
        db: AsyncSession,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = NotificationType.SYSTEM,
        metadata: Optional[Dict[str, Any]] = None,
        user_email: Optional[str] = None,
    ) -> Notification:
        # 1. Persist notification in database
        metadata_str = json.dumps(metadata) if metadata else None
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            metadata_json=metadata_str,
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)

        # 2. Push via WebSocket if user is actively connected
        ws_payload = {
            "type": "NOTIFICATION",
            "id": notification.id,
            "title": title,
            "message": message,
            "notification_type": notification_type,
            "metadata": metadata or {},
            "created_at": notification.created_at.isoformat(),
        }
        await ws_manager.send_user_notification(user_id, ws_payload)

        # 3. Simulate email delivery
        if user_email:
            self.email_provider.send_email(
                to_email=user_email,
                subject=f"Update: {title}",
                body_text=message,
            )

        return notification


notification_service = NotificationService()
