from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.driver import Driver
from app.models.user import User, UserRole
from app.schemas.delivery import DeliveryResponse, DeliveryStatusUpdate
from app.services.delivery_service import delivery_service

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])


@router.get("", response_model=List[DeliveryResponse])
async def list_deliveries(
    available: bool = Query(False, description="Filter for unassigned available jobs"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns deliveries:
    - If available=True: open delivery jobs waiting for pickup
    - If driver: deliveries assigned to the current driver
    - If admin: all deliveries
    """
    if available or current_user.role == UserRole.DELIVERY_DRIVER and available:
        return await delivery_service.get_available_deliveries(db)

    if current_user.role == UserRole.DELIVERY_DRIVER:
        driver_res = await db.execute(select(Driver).where(Driver.user_id == current_user.id))
        driver = driver_res.scalar_one_or_none()
        if not driver:
            return []
        return await delivery_service.get_driver_deliveries(db, driver.id)

    return await delivery_service.get_all_deliveries(db)


@router.get("/{id}", response_model=DeliveryResponse)
async def get_delivery(id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves full delivery details, status, driver info, and breadcrumb path."""
    delivery = await delivery_service.get_by_id(db, id)
    if not delivery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")
    return delivery


@router.get("/by-order/{order_id}", response_model=DeliveryResponse)
async def get_delivery_by_order(order_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves delivery assigned to an order ID."""
    delivery = await delivery_service.get_by_order_id(db, order_id)
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found for this order"
        )
    return delivery


@router.post("/{id}/accept", response_model=DeliveryResponse)
async def accept_delivery(
    id: str,
    current_user: User = Depends(require_roles([UserRole.DELIVERY_DRIVER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Driver accepts an assigned delivery job."""
    driver_res = await db.execute(select(Driver).where(Driver.user_id == current_user.id))
    driver = driver_res.scalar_one_or_none()
    if not driver and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Driver profile not found"
        )

    driver_id = driver.id if driver else current_user.id
    return await delivery_service.accept_delivery(db, delivery_id=id, driver_id=driver_id)


@router.patch("/{id}/status", response_model=DeliveryResponse)
async def update_delivery_status(
    id: str,
    data: DeliveryStatusUpdate,
    current_user: User = Depends(require_roles([UserRole.DELIVERY_DRIVER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Advances delivery status (ARRIVED_AT_RESTAURANT, PICKED_UP, IN_TRANSIT, DELIVERED)."""
    delivery = await delivery_service.get_by_id(db, id)
    if not delivery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")

    updated = await delivery_service.update_status(db, delivery, data.status)
    return await delivery_service.get_by_id(db, updated.id)
