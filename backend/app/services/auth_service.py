from datetime import timedelta
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.models.driver import Driver
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, TokenResponse, UserResponse


class AuthService:
    @staticmethod
    async def register(db: AsyncSession, data: UserCreate) -> User:
        # Check if email exists
        existing = await db.execute(select(User).where(User.email == data.email.lower()))
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists.",
            )

        role = data.role.upper()
        if role not in [
            UserRole.CUSTOMER,
            UserRole.RESTAURANT,
            UserRole.DELIVERY_DRIVER,
            UserRole.ADMIN,
        ]:
            role = UserRole.CUSTOMER

        user = User(
            email=data.email.lower(),
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
            phone=data.phone,
            role=role,
            is_active=True,
        )
        db.add(user)
        await db.flush()

        # If user registered as DELIVERY_DRIVER, automatically initialize their Driver profile
        if role == UserRole.DELIVERY_DRIVER:
            driver = Driver(
                user_id=user.id,
                vehicle_type="car",
                is_available=True,
                rating=5.0,
            )
            db.add(driver)

        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def authenticate(db: AsyncSession, email: str, password: str) -> User:
        result = await db.execute(select(User).where(User.email == email.lower()))
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is inactive",
            )
        return user

    @staticmethod
    def create_token(user: User) -> TokenResponse:
        token = create_access_token(
            subject=user.id,
            role=user.role,
            additional_claims={"email": user.email, "name": user.full_name},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        )


auth_service = AuthService()
