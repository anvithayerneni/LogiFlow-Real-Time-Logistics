import math
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from app.core.config import settings


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great-circle distance between two points on the Earth
    using the Haversine formula.
    """
    R = 6371.0  # Earth's radius in kilometers

    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)

    a = (
        math.sin(d_lat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = R * c
    return round(distance, 2)


def calculate_travel_time_minutes(
    distance_km: float, speed_kmh: float = settings.DEFAULT_AVERAGE_SPEED_KMH
) -> float:
    """Calculates driving time in minutes given distance and average speed."""
    if speed_kmh <= 0:
        speed_kmh = settings.DEFAULT_AVERAGE_SPEED_KMH
    hours = distance_km / speed_kmh
    return round(hours * 60.0, 1)


def calculate_delivery_eta(
    restaurant_lat: float,
    restaurant_lon: float,
    customer_lat: float,
    customer_lon: float,
    driver_lat: Optional[float] = None,
    driver_lon: Optional[float] = None,
    prep_time_minutes: int = 20,
    average_speed_kmh: float = settings.DEFAULT_AVERAGE_SPEED_KMH,
) -> Dict[str, Any]:
    """
    Computes modular ETA for pickup and delivery.

    Demonstration logic:
    - If driver location is provided, calculates driver travel time to restaurant.
    - Estimated pickup time = max(prep_time, driver_travel_time) + handoff_buffer.
    - Estimated delivery time = pickup_time + travel_time(restaurant -> customer).
    """
    now = datetime.now(timezone.utc)

    # Distance from restaurant to customer
    dropoff_distance_km = haversine_distance_km(
        restaurant_lat, restaurant_lon, customer_lat, customer_lon
    )
    transit_to_customer_minutes = calculate_travel_time_minutes(
        dropoff_distance_km, average_speed_kmh
    )

    # Driver to restaurant distance (if driver assigned)
    if driver_lat is not None and driver_lon is not None:
        pickup_distance_km = haversine_distance_km(
            driver_lat, driver_lon, restaurant_lat, restaurant_lon
        )
        transit_to_restaurant_minutes = calculate_travel_time_minutes(
            pickup_distance_km, average_speed_kmh
        )
    else:
        pickup_distance_km = 0.0
        transit_to_restaurant_minutes = 10.0  # Assumed default dispatch lead time

    # Pickup ETA = maximum of prep time and driver transit time + buffer
    prep_lead_minutes = (
        max(float(prep_time_minutes), transit_to_restaurant_minutes)
        + settings.DEFAULT_PREP_BUFFER_MINUTES
    )
    estimated_pickup = now + timedelta(minutes=prep_lead_minutes)

    # Total ETA = Pickup ETA + transit to customer + handoff
    total_duration_minutes = (
        prep_lead_minutes + transit_to_customer_minutes + 3.0
    )  # 3 min customer dropoff buffer
    estimated_delivery = now + timedelta(minutes=total_duration_minutes)

    return {
        "distance_to_restaurant_km": pickup_distance_km,
        "distance_to_customer_km": dropoff_distance_km,
        "total_distance_km": round(pickup_distance_km + dropoff_distance_km, 2),
        "transit_to_restaurant_minutes": transit_to_restaurant_minutes,
        "transit_to_customer_minutes": transit_to_customer_minutes,
        "prep_time_minutes": prep_time_minutes,
        "estimated_pickup_time": estimated_pickup,
        "estimated_delivery_time": estimated_delivery,
        "total_estimated_duration_minutes": round(total_duration_minutes, 1),
    }
