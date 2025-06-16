from typing import Dict, Set
from fastapi import HTTPException, status
from app.models.order import OrderStatus
from app.models.delivery import DeliveryStatus


class InvalidStateTransitionError(HTTPException):
    def __init__(self, entity: str, current_state: str, target_state: str):
        detail = f"Invalid {entity} status transition from '{current_state}' to '{target_state}'."
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


# Valid order status transition map
ORDER_TRANSITIONS: Dict[str, Set[str]] = {
    OrderStatus.CREATED: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.REJECTED},
    OrderStatus.CONFIRMED: {OrderStatus.PREPARING, OrderStatus.CANCELLED},
    OrderStatus.PREPARING: {OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED},
    OrderStatus.READY_FOR_PICKUP: {OrderStatus.PICKED_UP, OrderStatus.CANCELLED},
    OrderStatus.PICKED_UP: {OrderStatus.OUT_FOR_DELIVERY},
    OrderStatus.OUT_FOR_DELIVERY: {OrderStatus.DELIVERED},
    OrderStatus.DELIVERED: set(),  # Terminal state
    OrderStatus.CANCELLED: set(),  # Terminal state
    OrderStatus.REJECTED: set(),  # Terminal state
}

# Valid delivery status transition map
DELIVERY_TRANSITIONS: Dict[str, Set[str]] = {
    DeliveryStatus.PENDING: {DeliveryStatus.ASSIGNED, DeliveryStatus.CANCELLED},
    DeliveryStatus.ASSIGNED: {
        DeliveryStatus.ACCEPTED,
        DeliveryStatus.PENDING,
        DeliveryStatus.CANCELLED,
    },
    DeliveryStatus.ACCEPTED: {DeliveryStatus.ARRIVED_AT_RESTAURANT, DeliveryStatus.CANCELLED},
    DeliveryStatus.ARRIVED_AT_RESTAURANT: {DeliveryStatus.PICKED_UP, DeliveryStatus.CANCELLED},
    DeliveryStatus.PICKED_UP: {DeliveryStatus.IN_TRANSIT},
    DeliveryStatus.IN_TRANSIT: {DeliveryStatus.DELIVERED},
    DeliveryStatus.DELIVERED: set(),  # Terminal state
    DeliveryStatus.CANCELLED: set(),  # Terminal state
}


def validate_order_transition(current_status: str, new_status: str) -> None:
    """
    Validates if transitioning from current_status to new_status is allowed.
    Raises InvalidStateTransitionError if disallowed.
    """
    allowed_next_states = ORDER_TRANSITIONS.get(current_status, set())
    if new_status not in allowed_next_states:
        raise InvalidStateTransitionError("Order", current_status, new_status)


def validate_delivery_transition(current_status: str, new_status: str) -> None:
    """
    Validates if transitioning from current_status to new_status is allowed.
    Raises InvalidStateTransitionError if disallowed.
    """
    allowed_next_states = DELIVERY_TRANSITIONS.get(current_status, set())
    if new_status not in allowed_next_states:
        raise InvalidStateTransitionError("Delivery", current_status, new_status)
