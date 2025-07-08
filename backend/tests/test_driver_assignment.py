import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import hash_password
from app.models.driver import Driver
from app.models.user import User, UserRole
from app.services.driver_assignment import driver_assignment_service


@pytest.mark.asyncio
async def test_driver_assignment_selects_closest_candidate(db_session: AsyncSession):
    # Restaurant at (37.7900, -122.4000)
    rest_lat, rest_lon = 37.7900, -122.4000
    pw = hash_password("pass123")

    # Driver 1: Very close (0.2 km away)
    u1 = User(
        email="d1@t.com",
        hashed_password=pw,
        full_name="Close Driver",
        role=UserRole.DELIVERY_DRIVER,
    )
    db_session.add(u1)
    await db_session.flush()
    d1 = Driver(
        user_id=u1.id,
        is_available=True,
        current_latitude=37.7910,
        current_longitude=-122.4010,
        active_deliveries_count=0,
        rating=4.9,
    )
    db_session.add(d1)

    # Driver 2: Far away (8.0 km away)
    u2 = User(
        email="d2@t.com", hashed_password=pw, full_name="Far Driver", role=UserRole.DELIVERY_DRIVER
    )
    db_session.add(u2)
    await db_session.flush()
    d2 = Driver(
        user_id=u2.id,
        is_available=True,
        current_latitude=37.7200,
        current_longitude=-122.4600,
        active_deliveries_count=0,
        rating=4.9,
    )
    db_session.add(d2)

    await db_session.commit()

    chosen = await driver_assignment_service.find_best_driver(
        db_session, restaurant_lat=rest_lat, restaurant_lon=rest_lon
    )
    assert chosen is not None
    assert chosen.id == d1.id


@pytest.mark.asyncio
async def test_driver_assignment_skips_unavailable_drivers(db_session: AsyncSession):
    rest_lat, rest_lon = 37.7900, -122.4000
    pw = hash_password("pass123")

    # Close but unavailable
    u1 = User(
        email="busy@t.com",
        hashed_password=pw,
        full_name="Busy Driver",
        role=UserRole.DELIVERY_DRIVER,
    )
    db_session.add(u1)
    await db_session.flush()
    d1 = Driver(
        user_id=u1.id,
        is_available=False,
        current_latitude=37.7905,
        current_longitude=-122.4005,
    )
    db_session.add(d1)

    # Further but available
    u2 = User(
        email="avail@t.com",
        hashed_password=pw,
        full_name="Available Driver",
        role=UserRole.DELIVERY_DRIVER,
    )
    db_session.add(u2)
    await db_session.flush()
    d2 = Driver(
        user_id=u2.id,
        is_available=True,
        current_latitude=37.7950,
        current_longitude=-122.4050,
    )
    db_session.add(d2)

    await db_session.commit()

    chosen = await driver_assignment_service.find_best_driver(
        db_session, restaurant_lat=rest_lat, restaurant_lon=rest_lon
    )
    assert chosen is not None
    assert chosen.id == d2.id
