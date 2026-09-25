import pytest
from app.models.delivery import DeliveryStatus
from app.models.order import OrderStatus
from app.services.state_machine import (
    InvalidStateTransitionError,
    validate_delivery_transition,
    validate_order_transition,
)


def test_valid_order_state_transitions():
    # Valid forward flow
    validate_order_transition(OrderStatus.CREATED, OrderStatus.CONFIRMED)
    validate_order_transition(OrderStatus.CONFIRMED, OrderStatus.PREPARING)
    validate_order_transition(OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP)
    validate_order_transition(OrderStatus.READY_FOR_PICKUP, OrderStatus.PICKED_UP)
    validate_order_transition(OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY)
    validate_order_transition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED)

    # Valid cancellations
    validate_order_transition(OrderStatus.CREATED, OrderStatus.CANCELLED)
    validate_order_transition(OrderStatus.CONFIRMED, OrderStatus.CANCELLED)
    validate_order_transition(OrderStatus.PREPARING, OrderStatus.CANCELLED)
    validate_order_transition(OrderStatus.CREATED, OrderStatus.REJECTED)


def test_invalid_order_state_transitions():
    # Attempting to go backwards or jump illegally
    with pytest.raises(InvalidStateTransitionError):
        validate_order_transition(OrderStatus.DELIVERED, OrderStatus.PREPARING)

    with pytest.raises(InvalidStateTransitionError):
        validate_order_transition(OrderStatus.DELIVERED, OrderStatus.CANCELLED)

    with pytest.raises(InvalidStateTransitionError):
        validate_order_transition(OrderStatus.CANCELLED, OrderStatus.DELIVERED)

    with pytest.raises(InvalidStateTransitionError):
        validate_order_transition(OrderStatus.CREATED, OrderStatus.DELIVERED)


def test_valid_delivery_state_transitions():
    validate_delivery_transition(DeliveryStatus.PENDING, DeliveryStatus.ASSIGNED)
    validate_delivery_transition(DeliveryStatus.ASSIGNED, DeliveryStatus.ACCEPTED)
    validate_delivery_transition(DeliveryStatus.ACCEPTED, DeliveryStatus.ARRIVED_AT_RESTAURANT)
    validate_delivery_transition(DeliveryStatus.ARRIVED_AT_RESTAURANT, DeliveryStatus.PICKED_UP)
    validate_delivery_transition(DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT)
    validate_delivery_transition(DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED)


def test_invalid_delivery_state_transitions():
    with pytest.raises(InvalidStateTransitionError):
        validate_delivery_transition(DeliveryStatus.DELIVERED, DeliveryStatus.PICKED_UP)

    with pytest.raises(InvalidStateTransitionError):
        validate_delivery_transition(DeliveryStatus.PENDING, DeliveryStatus.DELIVERED)
