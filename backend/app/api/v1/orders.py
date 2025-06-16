from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.order import Order
from app.models.restaurant import Restaurant
from app.models.user import User, UserRole
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.services.order_service import order_service

router = APIRouter(prefix="/orders", tags=["Orders"])


def _format_order_response(order: Order) -> OrderResponse:
    resp = OrderResponse.model_validate(order)
    if order.restaurant:
        resp.restaurant_name = order.restaurant.name
    if order.customer:
        resp.customer_name = order.customer.full_name
    if order.delivery:
        resp.delivery_id = order.delivery.id
    return resp


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Creates a new order, calculates pricing & ETAs, and triggers mock payment authorization."""
    order = await order_service.create_order(db, customer=current_user, data=data)
    # Refetch with relations
    loaded_order = await order_service.get_by_id(db, order.id)
    return _format_order_response(loaded_order or order)


@router.get("", response_model=List[OrderResponse])
async def list_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lists orders appropriate for the authenticated role:
    - Customer: their placed orders
    - Restaurant: orders placed with their managed restaurant
    - Admin: all platform orders
    """
    if current_user.role == UserRole.CUSTOMER:
        orders = await order_service.get_customer_orders(db, current_user.id)
    elif current_user.role == UserRole.RESTAURANT:
        # Find restaurant owned by user
        rest_res = await db.execute(
            select(Restaurant).where(Restaurant.owner_id == current_user.id)
        )
        restaurant = rest_res.scalar_one_or_none()
        if not restaurant:
            return []
        orders = await order_service.get_restaurant_orders(db, restaurant.id)
    elif current_user.role in [UserRole.ADMIN, UserRole.DELIVERY_DRIVER]:
        orders = await order_service.get_all_orders(db)
    else:
        orders = []

    return [_format_order_response(o) for o in orders]


@router.get("/{id}", response_model=OrderResponse)
async def get_order(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetches details for a specific order."""
    order = await order_service.get_by_id(db, id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Authorization check
    if current_user.role == UserRole.CUSTOMER and order.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return _format_order_response(order)


@router.patch("/{id}/status", response_model=OrderResponse)
async def update_order_status(
    id: str,
    data: OrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Advances order status through the strict state machine."""
    order = await order_service.get_by_id(db, id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Authorize who can make what transition
    # Customers can cancel if pending
    # Restaurants can confirm/prepare/ready/reject
    # Drivers/System update delivery progress
    updated = await order_service.update_status(
        db, order=order, new_status=data.status, reason=data.cancellation_reason
    )
    loaded = await order_service.get_by_id(db, updated.id)
    return _format_order_response(loaded or updated)
