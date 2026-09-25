from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.telemetry import DELIVERIES_COMPLETED_TOTAL, ACTIVE_DELIVERIES
from app.events.bus import event_bus
from app.events.event_schemas import (
    DeliveryCreatedEvent,
    DeliveryAssignedEvent,
    DriverLocationUpdatedEvent,
    BaseEvent,
)
from app.events.topics import KafkaTopics
from app.models.delivery import Delivery, DeliveryStatus
from app.models.driver import Driver, DriverLocation
from app.models.order import Order, OrderStatus
from app.models.restaurant import Restaurant
from app.models.user import Address
from app.services.driver_assignment import driver_assignment_service
from app.services.eta_calculator import calculate_delivery_eta, haversine_distance_km
from app.services.notification_service import notification_service
from app.services.redis_service import redis_service
from app.services.state_machine import validate_delivery_transition
from app.websockets.connection_manager import ws_manager


class DeliveryService:
    @staticmethod
    async def get_by_id(db: AsyncSession, delivery_id: str) -> Optional[Delivery]:
        query = (
            select(Delivery)
            .where(Delivery.id == delivery_id)
            .options(
                selectinload(Delivery.order).selectinload(Order.items),
                selectinload(Delivery.order).selectinload(Order.restaurant),
                selectinload(Delivery.driver).selectinload(Driver.user),
                selectinload(Delivery.tracking_breadcrumbs),
            )
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_order_id(db: AsyncSession, order_id: str) -> Optional[Delivery]:
        query = (
            select(Delivery)
            .where(Delivery.order_id == order_id)
            .options(
                selectinload(Delivery.order).selectinload(Order.items),
                selectinload(Delivery.order).selectinload(Order.restaurant),
                selectinload(Delivery.driver).selectinload(Driver.user),
                selectinload(Delivery.tracking_breadcrumbs),
            )
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_driver_deliveries(db: AsyncSession, driver_id: str) -> List[Delivery]:
        query = (
            select(Delivery)
            .where(Delivery.driver_id == driver_id)
            .order_by(Delivery.created_at.desc())
            .options(
                selectinload(Delivery.order).selectinload(Order.restaurant),
                selectinload(Delivery.order).selectinload(Order.items),
            )
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_available_deliveries(db: AsyncSession) -> List[Delivery]:
        """Returns open deliveries that are waiting for driver pickup/assignment."""
        query = (
            select(Delivery)
            .where(Delivery.status.in_([DeliveryStatus.PENDING, DeliveryStatus.ASSIGNED]))
            .order_by(Delivery.created_at.desc())
            .options(
                selectinload(Delivery.order).selectinload(Order.restaurant),
                selectinload(Delivery.order).selectinload(Order.items),
            )
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_all_deliveries(db: AsyncSession, limit: int = 100) -> List[Delivery]:
        query = (
            select(Delivery)
            .order_by(Delivery.created_at.desc())
            .limit(limit)
            .options(
                selectinload(Delivery.order).selectinload(Order.restaurant),
                selectinload(Delivery.driver).selectinload(Driver.user),
            )
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def create_and_dispatch_delivery(db: AsyncSession, order: Order) -> Delivery:
        # Check if delivery already exists for this order
        existing = await DeliveryService.get_by_order_id(db, order.id)
        if existing:
            return existing

        # Fetch restaurant coords
        rest_query = select(Restaurant).where(Restaurant.id == order.restaurant_id)
        rest_res = await db.execute(rest_query)
        restaurant = rest_res.scalar_one()

        # Fetch customer coords
        dropoff_lat = restaurant.latitude + 0.02
        dropoff_lon = restaurant.longitude + 0.02
        if order.delivery_address_id:
            addr_res = await db.execute(
                select(Address).where(Address.id == order.delivery_address_id)
            )
            address = addr_res.scalar_one_or_none()
            if address:
                dropoff_lat = address.latitude
                dropoff_lon = address.longitude

        # Compute trip distance
        trip_distance_km = haversine_distance_km(
            restaurant.latitude, restaurant.longitude, dropoff_lat, dropoff_lon
        )

        # Run driver assignment
        assigned_driver = await driver_assignment_service.find_best_driver(
            db, restaurant_lat=restaurant.latitude, restaurant_lon=restaurant.longitude
        )

        delivery_status = DeliveryStatus.ASSIGNED if assigned_driver else DeliveryStatus.PENDING
        driver_id = assigned_driver.id if assigned_driver else None

        # Compute ETA
        driver_lat = assigned_driver.current_latitude if assigned_driver else None
        driver_lon = assigned_driver.current_longitude if assigned_driver else None
        eta = calculate_delivery_eta(
            restaurant_lat=restaurant.latitude,
            restaurant_lon=restaurant.longitude,
            customer_lat=dropoff_lat,
            customer_lon=dropoff_lon,
            driver_lat=driver_lat,
            driver_lon=driver_lon,
            prep_time_minutes=restaurant.prep_time_minutes,
        )

        delivery = Delivery(
            order_id=order.id,
            driver_id=driver_id,
            status=delivery_status,
            pickup_latitude=restaurant.latitude,
            pickup_longitude=restaurant.longitude,
            dropoff_latitude=dropoff_lat,
            dropoff_longitude=dropoff_lon,
            distance_km=trip_distance_km,
            estimated_pickup_time=eta["estimated_pickup_time"],
            estimated_delivery_time=eta["estimated_delivery_time"],
        )
        db.add(delivery)

        if assigned_driver:
            assigned_driver.active_deliveries_count += 1

        await db.commit()
        await db.refresh(delivery)
        ACTIVE_DELIVERIES.inc()

        # Emit Kafka events
        await event_bus.publish(
            KafkaTopics.DELIVERY_CREATED,
            DeliveryCreatedEvent(
                correlation_id=delivery.id,
                payload={
                    "delivery_id": delivery.id,
                    "order_id": order.id,
                    "status": delivery.status,
                },
            ),
        )

        if assigned_driver:
            await event_bus.publish(
                KafkaTopics.DELIVERY_ASSIGNED,
                DeliveryAssignedEvent(
                    correlation_id=delivery.id,
                    payload={"delivery_id": delivery.id, "driver_id": assigned_driver.id},
                ),
            )
            # Notify Driver
            await notification_service.create_notification(
                db=db,
                user_id=assigned_driver.user_id,
                title="New Delivery Job Assigned!",
                message=f"Pickup from {restaurant.name} for Order #{order.id[:8]}",
                metadata={"delivery_id": delivery.id, "order_id": order.id},
            )

        # Notify Customer
        await notification_service.create_notification(
            db=db,
            user_id=order.customer_id,
            title="Driver Assigned",
            message="A driver has been assigned to pick up your order!",
            metadata={"delivery_id": delivery.id, "order_id": order.id},
        )

        return delivery

    @staticmethod
    async def accept_delivery(db: AsyncSession, delivery_id: str, driver_id: str) -> Delivery:
        delivery = await DeliveryService.get_by_id(db, delivery_id)
        if not delivery:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")

        validate_delivery_transition(delivery.status, DeliveryStatus.ACCEPTED)
        delivery.driver_id = driver_id
        delivery.status = DeliveryStatus.ACCEPTED

        await db.commit()
        await db.refresh(delivery)

        await ws_manager.broadcast_delivery_update(
            delivery.id,
            {
                "type": "DELIVERY_STATUS_CHANGED",
                "delivery_id": delivery.id,
                "status": delivery.status,
            },
        )
        return delivery

    @staticmethod
    async def update_status(
        db: AsyncSession,
        delivery: Delivery,
        new_status: str,
    ) -> Delivery:
        validate_delivery_transition(delivery.status, new_status)
        now = datetime.now(timezone.utc)
        delivery.status = new_status

        # Synchronize linked Order status
        order_res = await db.execute(select(Order).where(Order.id == delivery.order_id))
        order = order_res.scalar_one_or_none()

        if new_status == DeliveryStatus.PICKED_UP:
            delivery.actual_pickup_time = now
            if order:
                order.status = OrderStatus.PICKED_UP
            await event_bus.publish(
                KafkaTopics.DELIVERY_PICKED_UP,
                BaseEvent(
                    event_type=KafkaTopics.DELIVERY_PICKED_UP,
                    correlation_id=delivery.id,
                    payload={"delivery_id": delivery.id},
                ),
            )

        elif new_status == DeliveryStatus.IN_TRANSIT:
            if order:
                order.status = OrderStatus.OUT_FOR_DELIVERY
            await event_bus.publish(
                KafkaTopics.DELIVERY_IN_TRANSIT,
                BaseEvent(
                    event_type=KafkaTopics.DELIVERY_IN_TRANSIT,
                    correlation_id=delivery.id,
                    payload={"delivery_id": delivery.id},
                ),
            )

        elif new_status == DeliveryStatus.DELIVERED:
            delivery.actual_delivery_time = now
            if order:
                order.status = OrderStatus.DELIVERED
            # Update driver availability and active deliveries
            if delivery.driver_id:
                driver_res = await db.execute(select(Driver).where(Driver.id == delivery.driver_id))
                driver = driver_res.scalar_one_or_none()
                if driver:
                    driver.active_deliveries_count = max(0, driver.active_deliveries_count - 1)
                    driver.is_available = True

            DELIVERIES_COMPLETED_TOTAL.inc()
            ACTIVE_DELIVERIES.dec()
            await event_bus.publish(
                KafkaTopics.DELIVERY_DELIVERED,
                BaseEvent(
                    event_type=KafkaTopics.DELIVERY_DELIVERED,
                    correlation_id=delivery.id,
                    payload={"delivery_id": delivery.id},
                ),
            )

        await db.commit()
        await db.refresh(delivery)

        # Broadcast live status update to WebSocket tracking listeners
        await ws_manager.broadcast_delivery_update(
            delivery.id,
            {
                "type": "DELIVERY_STATUS_CHANGED",
                "delivery_id": delivery.id,
                "status": delivery.status,
            },
        )
        return delivery

    @staticmethod
    async def record_driver_location(
        db: AsyncSession,
        driver_id: str,
        latitude: float,
        longitude: float,
        delivery_id: Optional[str] = None,
        speed: Optional[float] = None,
        heading: Optional[float] = None,
    ) -> DriverLocation:
        now = datetime.now(timezone.utc)

        # 1. Update Driver entity current position
        driver_res = await db.execute(select(Driver).where(Driver.id == driver_id))
        driver = driver_res.scalar_one_or_none()
        if driver:
            driver.current_latitude = latitude
            driver.current_longitude = longitude
            driver.last_location_update = now

        # 2. Record historical breadcrumb point
        location = DriverLocation(
            driver_id=driver_id,
            delivery_id=delivery_id,
            latitude=latitude,
            longitude=longitude,
            speed=speed,
            heading=heading,
            timestamp=now,
        )
        db.add(location)
        await db.commit()
        await db.refresh(location)

        # 3. Update Redis cache for fast sub-millisecond retrieval
        await redis_service.set_driver_location(
            driver_id=driver_id,
            latitude=latitude,
            longitude=longitude,
            delivery_id=delivery_id,
            speed=speed,
            heading=heading,
        )

        # 4. Publish Kafka event
        await event_bus.publish(
            KafkaTopics.DRIVER_LOCATION_UPDATED,
            DriverLocationUpdatedEvent(
                correlation_id=driver_id,
                payload={
                    "driver_id": driver_id,
                    "delivery_id": delivery_id,
                    "latitude": latitude,
                    "longitude": longitude,
                    "speed": speed,
                    "heading": heading,
                    "timestamp": now.isoformat(),
                },
            ),
        )

        # 5. Broadcast real-time location to connected WebSockets tracking this delivery
        if delivery_id:
            await ws_manager.broadcast_delivery_update(
                delivery_id,
                {
                    "type": "DRIVER_LOCATION_UPDATE",
                    "delivery_id": delivery_id,
                    "driver_id": driver_id,
                    "latitude": latitude,
                    "longitude": longitude,
                    "speed": speed,
                    "heading": heading,
                    "timestamp": now.isoformat(),
                },
            )

        return location


delivery_service = DeliveryService()
