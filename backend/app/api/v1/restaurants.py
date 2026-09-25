from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import require_roles
from app.models.restaurant import MenuItem
from app.models.user import User, UserRole
from app.schemas.restaurant import (
    MenuCategoryCreate,
    MenuCategoryResponse,
    MenuItemCreate,
    MenuItemResponse,
    MenuItemUpdate,
    RestaurantCreate,
    RestaurantResponse,
    RestaurantUpdate,
)
from app.services.restaurant_service import restaurant_service

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])


@router.get("", response_model=List[RestaurantResponse])
async def list_restaurants(
    cuisine: Optional[str] = Query(None, description="Filter by cuisine"),
    search: Optional[str] = Query(None, description="Search restaurant name"),
    db: AsyncSession = Depends(get_db),
):
    """Browses active restaurants, optionally filtered by cuisine or search term."""
    return await restaurant_service.get_all_active(db, cuisine=cuisine, search=search)


@router.get("/{id}", response_model=RestaurantResponse)
async def get_restaurant(id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves full restaurant profile with categories and menu items."""
    restaurant = await restaurant_service.get_by_id(db, id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    return restaurant


@router.get("/{id}/menu", response_model=List[MenuItemResponse])
async def get_restaurant_menu(id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves all menu items for a specific restaurant."""
    restaurant = await restaurant_service.get_by_id(db, id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    return restaurant.menu_items


@router.post("", response_model=RestaurantResponse, status_code=status.HTTP_201_CREATED)
async def create_restaurant(
    data: RestaurantCreate,
    current_user: User = Depends(require_roles([UserRole.RESTAURANT, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Creates a new restaurant associated with the authenticated restaurant owner."""
    return await restaurant_service.create_restaurant(db, owner_id=current_user.id, data=data)


@router.patch("/{id}", response_model=RestaurantResponse)
async def update_restaurant(
    id: str,
    data: RestaurantUpdate,
    current_user: User = Depends(require_roles([UserRole.RESTAURANT, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Updates restaurant details (name, description, prep time, status)."""
    restaurant = await restaurant_service.get_by_id(db, id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    if current_user.role != UserRole.ADMIN and restaurant.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this restaurant"
        )
    return await restaurant_service.update_restaurant(db, restaurant, data)


@router.post(
    "/{id}/categories", response_model=MenuCategoryResponse, status_code=status.HTTP_201_CREATED
)
async def add_category(
    id: str,
    data: MenuCategoryCreate,
    current_user: User = Depends(require_roles([UserRole.RESTAURANT, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    restaurant = await restaurant_service.get_by_id(db, id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    if current_user.role != UserRole.ADMIN and restaurant.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return await restaurant_service.add_category(db, id, data)


@router.post("/{id}/items", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
async def add_menu_item(
    id: str,
    data: MenuItemCreate,
    current_user: User = Depends(require_roles([UserRole.RESTAURANT, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    restaurant = await restaurant_service.get_by_id(db, id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    if current_user.role != UserRole.ADMIN and restaurant.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return await restaurant_service.add_menu_item(db, id, data)


@router.patch("/{id}/items/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    id: str,
    item_id: str,
    data: MenuItemUpdate,
    current_user: User = Depends(require_roles([UserRole.RESTAURANT, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    restaurant = await restaurant_service.get_by_id(db, id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    if current_user.role != UserRole.ADMIN and restaurant.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    item_res = await db.execute(
        select(MenuItem).where(MenuItem.id == item_id, MenuItem.restaurant_id == id)
    )
    item = item_res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")

    return await restaurant_service.update_menu_item(db, item, data)


@router.delete("/{id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_item(
    id: str,
    item_id: str,
    current_user: User = Depends(require_roles([UserRole.RESTAURANT, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    restaurant = await restaurant_service.get_by_id(db, id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    if current_user.role != UserRole.ADMIN and restaurant.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    item_res = await db.execute(
        select(MenuItem).where(MenuItem.id == item_id, MenuItem.restaurant_id == id)
    )
    item = item_res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")

    await restaurant_service.delete_menu_item(db, item)
    return None
