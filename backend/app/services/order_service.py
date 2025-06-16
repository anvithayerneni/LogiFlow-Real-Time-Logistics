from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.logging import logger
from app.core.telemetry import ORDERS_CREATED_TOTAL, ORDERS_COMPLETED_TOTAL
from app.events.bus import event_bus
from app.events.event_schemas import (
    OrderCreatedEvent,
    OrderAcceptedEvent,
    OrderReadyEvent,
    BaseEvent,
)
from app.events.topics import KafkaTopics
from app.models.user import User, Address
from app.models.order import Order, OrderItem, OrderStatus
from app.models.restaurant import Restaurant, MenuItem
from app.schemas.order import OrderCreate
from app.services.eta_calculator import calculate_delivery_eta, haversine_distance_km
from app.services.notification_service import notification_service
from app.services.payment_service import payment_service
from app.services.state_machine import validate_order_transition
from app.websockets.connection_manager import ws_manager


class OrderService:
    @staticmethod
    async def get_by_id(db: AsyncSession, order_id: str) -> Optional[Order]:
        query = (
            select(Order)
            .where(Order.id == order_id)
            .options(
                selectinload(Order.items),
                selectinload(Order.restaurant),
                selectinload(Order.customer),
                selectinload(Order.delivery),
                selectinload(Order.payment),
            )
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_customer_orders(db: AsyncSession, customer_id: str) -> List[Order]:
        query = (
            select(Order)
            .where(Order.customer_id == customer_id)
            .order_by(Order.created_at.desc())
            .options(
                selectinload(Order.items),
                selectinload(Order.restaurant),
                selectinload(Order.delivery),
                selectinload(Order.payment),
            )
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_restaurant_orders(db: AsyncSession, restaurant_id: str) -> List[Order]:
        query = (
            select(Order)
            .where(Order.restaurant_id == restaurant_id)
            .order_by(Order.created_at.desc())
            .options(
                selectinload(Order.items),
                selectinload(Order.customer),
                selectinload(Order.delivery),
                selectinload(Order.payment),
            )
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_all_orders(db: AsyncSession, limit: int = 100) -> List[Order]:
        query = (
            select(Order)
            .order_by(Order.created_at.desc())
            .limit(limit)
            .options(
                selectinload(Order.items),
                selectinload(Order.restaurant),
                selectinload(Order.customer),
                selectinload(Order.delivery),
                selectinload(Order.payment),
            )
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def create_order(db: AsyncSession, customer: User, data: OrderCreate) -> Order:
        # 1. Fetch restaurant
        rest_query = select(Restaurant).where(Restaurant.id == data.restaurant_id)
        rest_res = await db.execute(rest_query)
        restaurant = rest_res.scalar_one_or_none()
        if not restaurant or not restaurant.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not available"
            )

        # 2. Fetch customer delivery address
        customer_lat = restaurant.latitude + 0.02
        customer_lon = restaurant.longitude + 0.02
        if data.delivery_address_id:
            addr_query = select(Address).where(Address.id == data.delivery_address_id)
            addr_res = await db.execute(addr_query)
            address = addr_res.scalar_one_or_none()
            if address:
                customer_lat = address.latitude
                customer_lon = address.longitude

        # 3. Fetch menu items and compute totals
        item_ids = [item_in.menu_item_id for item_in in data.items]
        items_query = select(MenuItem).where(MenuItem.id.in_(item_ids))
        items_res = await db.execute(items_query)
        menu_items_map = {item.id: item for item in items_res.scalars().all()}

        subtotal = 0.0
        order_items_to_create = []

        for item_in in data.items:
            menu_item = menu_items_map.get(item_in.menu_item_id)
            if not menu_item:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Menu item {item_in.menu_item_id} not found",
                )
            if not menu_item.is_available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Menu item '{menu_item.name}' is currently sold out",
                )

            item_total = round(menu_item.price * item_in.quantity, 2)
            subtotal += item_total

            order_items_to_create.append(
                OrderItem(
                    menu_item_id=menu_item.id,
                    item_name=menu_item.name,
                    unit_price=menu_item.price,
                    quantity=item_in.quantity,
                    total_price=item_total,
                    special_instructions=item_in.special_instructions,
                )
            )

        # Distance & Fees
        distance_km = haversine_distance_km(
            restaurant.latitude, restaurant.longitude, customer_lat, customer_lon
        )
        delivery_fee = round(
            settings.BASE_DELIVERY_FEE + (distance_km * settings.PER_KM_DELIVERY_FEE), 2
        )
        tax = round(subtotal * settings.TAX_RATE, 2)
        total_amount = round(subtotal + delivery_fee + tax, 2)

        # ETA calculations
        eta_info = calculate_delivery_eta(
            restaurant_lat=restaurant.latitude,
            restaurant_lon=restaurant.longitude,
            customer_lat=customer_lat,
            customer_lon=customer_lon,
            prep_time_minutes=restaurant.prep_time_minutes,
        )

        order = Order(
            customer_id=customer.id,
            restaurant_id=restaurant.id,
            delivery_address_id=data.delivery_address_id,
            status=OrderStatus.CREATED,
            subtotal=round(subtotal, 2),
            delivery_fee=delivery_fee,
            tax=tax,
            total_amount=total_amount,
            customer_notes=data.customer_notes,
            estimated_prep_time_minutes=restaurant.prep_time_minutes,
            estimated_delivery_time=eta_info["estimated_delivery_time"],
            items=order_items_to_create,
        )
        db.add(order)
        await db.commit()
        await db.refresh(order)

        # 4. Process simulated payment immediately
        await payment_service.process_payment(
            db=db,
            order_id=order.id,
            amount=total_amount,
        )

        # 5. Emit event to Kafka EventBus
        event = OrderCreatedEvent(
            correlation_id=order.id,
            payload={
                "order_id": order.id,
                "customer_id": order.customer_id,
                "restaurant_id": order.restaurant_id,
                "total_amount": order.total_amount,
            },
        )
        await event_bus.publish(KafkaTopics.ORDER_CREATED, event)
        ORDERS_CREATED_TOTAL.labels(restaurant_id=restaurant.id).inc()

        # 6. Notify restaurant owner and customer
        if restaurant.owner_id:
            await notification_service.create_notification(
                db=db,
                user_id=restaurant.owner_id,
                title="New Order Received!",
                message=f"Order #{order.id[:8]} placed for ${order.total_amount:.2f}",
                metadata={"order_id": order.id},
            )
        await notification_service.create_notification(
            db=db,
            user_id=customer.id,
            title="Order Placed Successfully",
            message=f"Your order with {restaurant.name} has been placed.",
            metadata={"order_id": order.id},
            user_email=customer.email,
        )

        return order

    @staticmethod
    async def update_status(
        db: AsyncSession,
        order: Order,
        new_status: str,
        reason: Optional[str] = None,
    ) -> Order:
        # Strict state machine transition validation
        validate_order_transition(order.status, new_status)

        old_status = order.status
        order.status = new_status
        if reason:
            order.cancellation_reason = reason

        await db.commit()
        await db.refresh(order)

        logger.info(f"Order {order.id} transitioned from {old_status} to {new_status}")

        # Broadcast state change to connected WebSockets
        await ws_manager.broadcast_delivery_update(
            order.id,
            {"type": "ORDER_STATUS_CHANGED", "order_id": order.id, "status": new_status},
        )

        # Handle events for specific transitions
        if new_status == OrderStatus.CONFIRMED:
            await event_bus.publish(
                KafkaTopics.ORDER_ACCEPTED,
                OrderAcceptedEvent(
                    correlation_id=order.id,
                    payload={"order_id": order.id, "status": new_status},
                ),
            )
            await notification_service.create_notification(
                db=db,
                user_id=order.customer_id,
                title="Order Confirmed",
                message="The restaurant has accepted and confirmed your order.",
                metadata={"order_id": order.id},
            )

        elif new_status == OrderStatus.PREPARING:
            await event_bus.publish(
                KafkaTopics.ORDER_PREPARING,
                BaseEvent(
                    event_type=KafkaTopics.ORDER_PREPARING,
                    correlation_id=order.id,
                    payload={"order_id": order.id},
                ),
            )
            await notification_service.create_notification(
                db=db,
                user_id=order.customer_id,
                title="Kitchen Preparing Food",
                message="Your food is now being prepared by the kitchen.",
                metadata={"order_id": order.id},
            )

        elif new_status == OrderStatus.READY_FOR_PICKUP:
            await event_bus.publish(
                KafkaTopics.ORDER_READY,
                OrderReadyEvent(
                    correlation_id=order.id,
                    payload={"order_id": order.id},
                ),
            )
            # Trigger delivery dispatching and driver assignment
            from app.services.delivery_service import delivery_service

            await delivery_service.create_and_dispatch_delivery(db, order)

        elif new_status in (OrderStatus.CANCELLED, OrderStatus.REJECTED):
            # Refund payment
            await payment_service.refund_payment(db, order.id)
            await notification_service.create_notification(
                db=db,
                user_id=order.customer_id,
                title=f"Order {new_status}",
                message=f"Your order was {new_status.lower()}. Reason: {reason or 'N/A'}. A refund has been issued.",
                metadata={"order_id": order.id},
            )

        elif new_status == OrderStatus.DELIVERED:
            ORDERS_COMPLETED_TOTAL.inc()
            await notification_service.create_notification(
                db=db,
                user_id=order.customer_id,
                title="Order Delivered!",
                message="Your meal has arrived! Enjoy your food.",
                metadata={"order_id": order.id},
            )

        return order


order_service = OrderService()
