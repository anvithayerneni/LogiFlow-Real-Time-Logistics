from fastapi import APIRouter
from app.api.v1 import admin, auth, deliveries, drivers, notifications, orders, restaurants, users

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(restaurants.router)
api_router.include_router(orders.router)
api_router.include_router(deliveries.router)
api_router.include_router(drivers.router)
api_router.include_router(notifications.router)
api_router.include_router(admin.router)
