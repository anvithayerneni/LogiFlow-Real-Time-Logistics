import json
from typing import Any, Dict, Set
from fastapi import WebSocket
from app.core.logging import logger


class ConnectionManager:
    def __init__(self):
        # delivery_id -> set of active WebSockets
        self.delivery_connections: Dict[str, Set[WebSocket]] = {}
        # user_id -> set of active WebSockets (notifications, orders)
        self.user_connections: Dict[str, Set[WebSocket]] = {}
        # driver_id -> set of active WebSockets
        self.driver_connections: Dict[str, Set[WebSocket]] = {}
        # general admin / platform listeners
        self.admin_connections: Set[WebSocket] = set()

    async def connect_delivery(self, delivery_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        if delivery_id not in self.delivery_connections:
            self.delivery_connections[delivery_id] = set()
        self.delivery_connections[delivery_id].add(websocket)
        logger.info(f"WebSocket connected for delivery {delivery_id}")

    def disconnect_delivery(self, delivery_id: str, websocket: WebSocket) -> None:
        if delivery_id in self.delivery_connections:
            self.delivery_connections[delivery_id].discard(websocket)
            if not self.delivery_connections[delivery_id]:
                del self.delivery_connections[delivery_id]
        logger.info(f"WebSocket disconnected for delivery {delivery_id}")

    async def broadcast_delivery_update(self, delivery_id: str, message: Dict[str, Any]) -> None:
        """Broadcasts live location or status update to all connected viewers of a delivery."""
        sockets = self.delivery_connections.get(delivery_id, set()).copy()
        payload = json.dumps(message)
        dead_sockets = []

        for ws in sockets:
            try:
                await ws.send_text(payload)
            except Exception as e:
                logger.debug(f"Failed to send to delivery socket: {str(e)}")
                dead_sockets.append(ws)

        for ws in dead_sockets:
            self.disconnect_delivery(delivery_id, ws)

    async def connect_user(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)

    def disconnect_user(self, user_id: str, websocket: WebSocket) -> None:
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

    async def send_user_notification(self, user_id: str, message: Dict[str, Any]) -> None:
        sockets = self.user_connections.get(user_id, set()).copy()
        payload = json.dumps(message)
        dead_sockets = []

        for ws in sockets:
            try:
                await ws.send_text(payload)
            except Exception:
                dead_sockets.append(ws)

        for ws in dead_sockets:
            self.disconnect_user(user_id, ws)

    async def connect_admin(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.admin_connections.add(websocket)

    def disconnect_admin(self, websocket: WebSocket) -> None:
        self.admin_connections.discard(websocket)

    async def broadcast_admin_event(self, message: Dict[str, Any]) -> None:
        payload = json.dumps(message)
        dead = []
        for ws in self.admin_connections.copy():
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.admin_connections.discard(ws)


ws_manager = ConnectionManager()
