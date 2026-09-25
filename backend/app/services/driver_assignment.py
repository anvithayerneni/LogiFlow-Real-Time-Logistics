from typing import List, Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger
from app.models.driver import Driver
from app.services.eta_calculator import haversine_distance_km


class DemonstrationDriverAssignmentService:
    """
    Demonstration Driver Assignment Service.

    NOTE: This is a demonstration assignment algorithm suitable for education
    and prototyping, not a production-grade fleet routing engine (e.g. VRP solver).

    Ranking Formula:
        score = (distance_km * 1.5) + (active_deliveries * 5.0) - (rating * 0.5)

    Lower score indicates a better candidate:
    - Minimizes deadhead distance to the restaurant
    - Penalizes drivers who already have active deliveries
    - Slightly rewards higher-rated drivers
    """

    @staticmethod
    async def find_best_driver(
        db: AsyncSession,
        restaurant_lat: float,
        restaurant_lon: float,
        max_search_radius_km: float = 25.0,
    ) -> Optional[Driver]:
        # 1. Query available drivers who have a known location
        query = select(Driver).where(
            Driver.is_available == True,
            Driver.current_latitude.isnot(None),
            Driver.current_longitude.isnot(None),
        )
        result = await db.execute(query)
        candidates: List[Driver] = list(result.scalars().all())

        if not candidates:
            # Fallback: query any available driver even without explicit current GPS
            fallback_query = select(Driver).where(Driver.is_available == True)
            fallback_res = await db.execute(fallback_query)
            fallback_candidates = list(fallback_res.scalars().all())
            if fallback_candidates:
                # Return driver with lowest active delivery count
                return min(fallback_candidates, key=lambda d: d.active_deliveries_count)
            return None

        # 2. Score candidates
        scored_drivers: List[Tuple[float, Driver]] = []
        for driver in candidates:
            dist_km = haversine_distance_km(
                driver.current_latitude, driver.current_longitude, restaurant_lat, restaurant_lon
            )

            # Skip candidates beyond the max dispatch radius
            if dist_km > max_search_radius_km:
                continue

            score = (dist_km * 1.5) + (driver.active_deliveries_count * 5.0) - (driver.rating * 0.5)
            scored_drivers.append((score, driver))

        if not scored_drivers:
            # If all are outside max radius, pick closest candidate
            closest_driver = min(
                candidates,
                key=lambda d: haversine_distance_km(
                    d.current_latitude, d.current_longitude, restaurant_lat, restaurant_lon
                ),
            )
            return closest_driver

        # 3. Sort by score ascending (lowest score is best)
        scored_drivers.sort(key=lambda item: item[0])
        best_candidate = scored_drivers[0][1]
        logger.info(
            f"Selected driver {best_candidate.id} with score {scored_drivers[0][0]:.2f} "
            f"for restaurant at ({restaurant_lat}, {restaurant_lon})"
        )
        return best_candidate


driver_assignment_service = DemonstrationDriverAssignmentService()
