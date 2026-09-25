from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.user import User, Address
from app.schemas.user import AddressCreate


class UserService:
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        query = (
            select(User)
            .where(User.id == user_id)
            .options(selectinload(User.addresses), selectinload(User.driver_profile))
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all(db: AsyncSession, limit: int = 100) -> List[User]:
        query = (
            select(User)
            .order_by(User.created_at.desc())
            .limit(limit)
            .options(selectinload(User.driver_profile))
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def add_address(db: AsyncSession, user_id: str, data: AddressCreate) -> Address:
        address = Address(
            user_id=user_id,
            label=data.label,
            street=data.street,
            city=data.city,
            state=data.state,
            postal_code=data.postal_code,
            latitude=data.latitude,
            longitude=data.longitude,
            is_default=data.is_default,
        )
        db.add(address)
        await db.commit()
        await db.refresh(address)
        return address

    @staticmethod
    async def get_addresses(db: AsyncSession, user_id: str) -> List[Address]:
        query = (
            select(Address).where(Address.user_id == user_id).order_by(Address.created_at.desc())
        )
        result = await db.execute(query)
        return list(result.scalars().all())


user_service = UserService()
