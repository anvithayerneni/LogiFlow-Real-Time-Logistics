from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.restaurant import Restaurant, MenuCategory, MenuItem
from app.schemas.restaurant import (
    RestaurantCreate,
    RestaurantUpdate,
    MenuItemCreate,
    MenuItemUpdate,
    MenuCategoryCreate,
)


class RestaurantService:
    @staticmethod
    async def get_all_active(
        db: AsyncSession, cuisine: Optional[str] = None, search: Optional[str] = None
    ) -> List[Restaurant]:
        query = select(Restaurant).where(Restaurant.is_active == True)
        if cuisine:
            query = query.where(Restaurant.cuisine_type.ilike(f"%{cuisine}%"))
        if search:
            query = query.where(Restaurant.name.ilike(f"%{search}%"))
        query = query.options(
            selectinload(Restaurant.categories).selectinload(MenuCategory.items),
            selectinload(Restaurant.menu_items),
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(db: AsyncSession, restaurant_id: str) -> Optional[Restaurant]:
        query = (
            select(Restaurant)
            .where(Restaurant.id == restaurant_id)
            .options(
                selectinload(Restaurant.categories).selectinload(MenuCategory.items),
                selectinload(Restaurant.menu_items),
            )
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def create_restaurant(
        db: AsyncSession, owner_id: Optional[str], data: RestaurantCreate
    ) -> Restaurant:
        restaurant = Restaurant(
            owner_id=owner_id,
            name=data.name,
            description=data.description,
            cuisine_type=data.cuisine_type,
            address=data.address,
            phone=data.phone,
            image_url=data.image_url,
            latitude=data.latitude,
            longitude=data.longitude,
            prep_time_minutes=data.prep_time_minutes,
        )
        db.add(restaurant)
        await db.commit()
        await db.refresh(restaurant)
        return restaurant

    @staticmethod
    async def update_restaurant(
        db: AsyncSession, restaurant: Restaurant, data: RestaurantUpdate
    ) -> Restaurant:
        update_dict = data.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(restaurant, key, val)
        await db.commit()
        await db.refresh(restaurant)
        return restaurant

    @staticmethod
    async def add_category(
        db: AsyncSession, restaurant_id: str, data: MenuCategoryCreate
    ) -> MenuCategory:
        category = MenuCategory(
            restaurant_id=restaurant_id,
            name=data.name,
            display_order=data.display_order,
        )
        db.add(category)
        await db.commit()
        await db.refresh(category)
        return category

    @staticmethod
    async def add_menu_item(db: AsyncSession, restaurant_id: str, data: MenuItemCreate) -> MenuItem:
        item = MenuItem(
            restaurant_id=restaurant_id,
            category_id=data.category_id,
            name=data.name,
            description=data.description,
            price=data.price,
            image_url=data.image_url,
            is_available=data.is_available,
        )
        db.add(item)
        await db.commit()
        await db.refresh(item)
        return item

    @staticmethod
    async def update_menu_item(db: AsyncSession, item: MenuItem, data: MenuItemUpdate) -> MenuItem:
        update_dict = data.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(item, key, val)
        await db.commit()
        await db.refresh(item)
        return item

    @staticmethod
    async def delete_menu_item(db: AsyncSession, item: MenuItem) -> None:
        await db.delete(item)
        await db.commit()


restaurant_service = RestaurantService()
