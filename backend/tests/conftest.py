import asyncio
from typing import Tuple
import os
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Set test environment
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_delivery.db"
os.environ["KAFKA_ENABLED"] = "false"
os.environ["REDIS_ENABLED"] = "false"

from app.core.database import Base, get_db
from app.core.security import hash_password, create_access_token
from app.main import app
from app.models.driver import Driver
from app.models.restaurant import Restaurant, MenuItem
from app.models.user import User, UserRole, Address

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestAsyncSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="session", autouse=True)
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session():
    async with TestAsyncSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def sample_customer(db_session: AsyncSession) -> User:
    user = User(
        email="test_customer@test.com",
        hashed_password=hash_password("password123"),
        full_name="Alice Customer",
        phone="+1-555-1111",
        role=UserRole.CUSTOMER,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    addr = Address(
        user_id=user.id,
        label="Home",
        street="100 Market St",
        city="San Francisco",
        state="CA",
        postal_code="94105",
        latitude=37.7935,
        longitude=-122.3965,
        is_default=True,
    )
    db_session.add(addr)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def sample_restaurant_owner(db_session: AsyncSession) -> User:
    owner = User(
        email="test_owner@test.com",
        hashed_password=hash_password("password123"),
        full_name="Chef Mario",
        role=UserRole.RESTAURANT,
        is_active=True,
    )
    db_session.add(owner)
    await db_session.commit()
    await db_session.refresh(owner)
    return owner


@pytest_asyncio.fixture
async def sample_restaurant(db_session: AsyncSession, sample_restaurant_owner: User) -> Restaurant:
    restaurant = Restaurant(
        owner_id=sample_restaurant_owner.id,
        name="Luigi's Pizzeria",
        cuisine_type="Italian",
        address="200 Montgomery St",
        latitude=37.7905,
        longitude=-122.4010,
        prep_time_minutes=20,
    )
    db_session.add(restaurant)
    await db_session.flush()

    item = MenuItem(
        restaurant_id=restaurant.id,
        name="Woodfired Margherita",
        price=18.00,
        is_available=True,
    )
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(restaurant)
    return restaurant


@pytest_asyncio.fixture
async def sample_driver(db_session: AsyncSession) -> Tuple[User, Driver]:
    user = User(
        email="test_driver@test.com",
        hashed_password=hash_password("password123"),
        full_name="Bob Courier",
        role=UserRole.DELIVERY_DRIVER,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    driver = Driver(
        user_id=user.id,
        vehicle_type="car",
        license_plate="TEST-DRV-1",
        is_available=True,
        current_latitude=37.7890,
        current_longitude=-122.4015,
        rating=5.0,
    )
    db_session.add(driver)
    await db_session.commit()
    await db_session.refresh(driver)
    return user, driver


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession) -> User:
    admin = User(
        email="admin_test@test.com",
        hashed_password=hash_password("password123"),
        full_name="Admin Boss",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin


def auth_header_for(user: User) -> dict:
    token = create_access_token(subject=user.id, role=user.role)
    return {"Authorization": f"Bearer {token}"}
