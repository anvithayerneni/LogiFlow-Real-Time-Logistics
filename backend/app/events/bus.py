import asyncio
import json
from typing import Any, Callable, Coroutine, Dict, List
from app.core.config import settings
from app.core.logging import logger
from app.core.telemetry import KAFKA_EVENTS_PROCESSED_TOTAL
from app.events.event_schemas import BaseEvent

EventHandler = Callable[[BaseEvent], Coroutine[Any, Any, None]]


class EventBus:
    def __init__(self):
        self._handlers: Dict[str, List[EventHandler]] = {}
        self._kafka_producer = None
        self._is_kafka_connected = False

    async def start(self) -> None:
        """Starts Kafka producer if enabled in settings."""
        if settings.KAFKA_ENABLED:
            try:
                from aiokafka import AIOKafkaProducer

                self._kafka_producer = AIOKafkaProducer(
                    bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                    client_id=settings.KAFKA_CLIENT_ID,
                    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                )
                await self._kafka_producer.start()
                self._is_kafka_connected = True
                logger.info(f"Kafka producer connected to {settings.KAFKA_BOOTSTRAP_SERVERS}")
            except Exception as e:
                logger.warning(
                    f"Could not connect to Kafka ({str(e)}). Running in-memory event bus mode."
                )
                self._is_kafka_connected = False

    async def stop(self) -> None:
        """Gracefully closes Kafka producer."""
        if self._kafka_producer and self._is_kafka_connected:
            await self._kafka_producer.stop()
            self._is_kafka_connected = False
            logger.info("Kafka producer stopped")

    def subscribe(self, topic: str, handler: EventHandler) -> None:
        """Registers an asynchronous subscriber handler for an event topic."""
        if topic not in self._handlers:
            self._handlers[topic] = []
        self._handlers[topic].append(handler)
        logger.debug(f"Subscribed handler to topic: {topic}")

    async def publish(self, topic: str, event: BaseEvent) -> None:
        """
        Publishes event to Kafka (if enabled) and dispatches to registered local handlers.
        """
        payload_dict = event.model_dump()

        # 1. Publish to real Kafka broker if connected
        if self._is_kafka_connected and self._kafka_producer:
            try:
                await self._kafka_producer.send_and_wait(topic, payload_dict)
                KAFKA_EVENTS_PROCESSED_TOTAL.labels(topic=topic, status="published").inc()
            except Exception as e:
                logger.error(f"Failed to publish event to Kafka on {topic}: {str(e)}")
                KAFKA_EVENTS_PROCESSED_TOTAL.labels(topic=topic, status="error").inc()

        # 2. Dispatch to in-process subscribers
        handlers = self._handlers.get(topic, [])
        for handler in handlers:
            try:
                asyncio.create_task(handler(event))
            except Exception as e:
                logger.error(
                    f"Error dispatching event {event.event_type} to local handler: {str(e)}"
                )


event_bus = EventBus()
