from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import require_roles
from app.models.driver import Driver
from app.models.user import User, UserRole
from app.schemas.driver import DriverLocationResponse, DriverLocationUpdate, DriverResponse
from app.services.delivery_service import delivery_service
from app.services.redis_service import redis_service

router = APIRouter(prefix="/drivers", tags=["Drivers"])


@router.get("/me", response_model=DriverResponse)
async def get_my_driver_profile(
    current_user: User = Depends(require_roles([UserRole.DELIVERY_DRIVER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    driver_res = await db.execute(select(Driver).where(Driver.user_id == current_user.id))
    driver = driver_res.scalar_one_or_none()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found"
        )

    resp = DriverResponse.model_validate(driver)
    resp.full_name = current_user.full_name
    resp.phone = current_user.phone
    return resp


@router.patch("/me/availability", response_model=DriverResponse)
async def toggle_availability(
    is_available: bool,
    current_user: User = Depends(require_roles([UserRole.DELIVERY_DRIVER])),
    db: AsyncSession = Depends(get_db),
):
    driver_res = await db.execute(select(Driver).where(Driver.user_id == current_user.id))
    driver = driver_res.scalar_one_or_none()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found"
        )

    driver.is_available = is_available
    await db.commit()
    await db.refresh(driver)

    resp = DriverResponse.model_validate(driver)
    resp.full_name = current_user.full_name
    return resp


@router.post(
    "/location", response_model=DriverLocationResponse, status_code=status.HTTP_201_CREATED
)
async def update_location(
    data: DriverLocationUpdate,
    current_user: User = Depends(require_roles([UserRole.DELIVERY_DRIVER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """
    Submits driver GPS telemetry (latitude, longitude, speed, heading, delivery_id).
    Publishes to Kafka, caches in Redis, and broadcasts live over WebSockets.
    """
    driver_res = await db.execute(select(Driver).where(Driver.user_id == current_user.id))
    driver = driver_res.scalar_one_or_none()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found"
        )

    loc = await delivery_service.record_driver_location(
        db=db,
        driver_id=driver.id,
        latitude=data.latitude,
        longitude=data.longitude,
        delivery_id=data.delivery_id,
        speed=data.speed,
        heading=data.heading,
    )
    return loc


@router.get("/{id}/location")
async def get_driver_cached_location(id: str):
    """Retrieves driver's sub-second cached location from Redis."""
    loc = await redis_service.get_driver_location(id)
    if not loc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No active location for driver"
        )
    return loc
