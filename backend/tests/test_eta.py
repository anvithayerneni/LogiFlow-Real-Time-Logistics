from app.services.eta_calculator import (
    calculate_delivery_eta,
    calculate_travel_time_minutes,
    haversine_distance_km,
)


def test_haversine_distance_calculation():
    # Coords between Ferry Building SF (37.7955, -122.3937) and Union Square SF (37.7879, -122.4075)
    # Approx 1.4 - 1.6 km
    dist = haversine_distance_km(37.7955, -122.3937, 37.7879, -122.4075)
    assert 1.2 <= dist <= 1.8

    # Identical coordinates should be 0.0 km
    assert haversine_distance_km(37.7749, -122.4194, 37.7749, -122.4194) == 0.0


def test_travel_time_calculation():
    # 15 km at 30 km/h should take 30 minutes
    minutes = calculate_travel_time_minutes(distance_km=15.0, speed_kmh=30.0)
    assert minutes == 30.0

    # 5 km at 30 km/h should take 10 minutes
    assert calculate_travel_time_minutes(distance_km=5.0, speed_kmh=30.0) == 10.0


def test_delivery_eta_calculation():
    res = calculate_delivery_eta(
        restaurant_lat=37.7900,
        restaurant_lon=-122.4000,
        customer_lat=37.8000,
        customer_lon=-122.4100,
        driver_lat=37.7850,
        driver_lon=-122.3950,
        prep_time_minutes=20,
        average_speed_kmh=30.0,
    )
    assert "estimated_pickup_time" in res
    assert "estimated_delivery_time" in res
    assert res["estimated_delivery_time"] > res["estimated_pickup_time"]
    assert res["total_distance_km"] > 0
    assert res["total_estimated_duration_minutes"] > 20
