import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.database import init_db
from app.core.logging import logger, request_id_ctx_var, setup_logging
from app.core.telemetry import HTTP_REQUESTS_TOTAL, HTTP_REQUEST_DURATION, metrics_endpoint
from app.events.bus import event_bus
from app.services.redis_service import redis_service
from app.websockets.connection_manager import ws_manager

setup_logging(debug=settings.DEBUG)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    logger.info("Initializing Real-Time Delivery & Logistics Platform backend...")
    await init_db()
    await redis_service.connect()
    await event_bus.start()
    logger.info("Platform backend startup complete.")

    yield

    # --- Shutdown ---
    logger.info("Shutting down platform services...")
    await event_bus.stop()
    await redis_service.close()
    logger.info("Platform backend shutdown complete.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Production-grade Real-Time Delivery & Logistics Platform API. "
        "Demonstrates Event-Driven Architecture, Microservices, WebSockets, "
        "Kafka streaming, Redis state, and PostgreSQL."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_tracing_and_metrics_middleware(request: Request, call_next):
    """Injects unique request ID for distributed tracing and records Prometheus latency."""
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    token = request_id_ctx_var.set(req_id)
    start_time = time.time()

    try:
        response = await call_next(request)
        duration = time.time() - start_time

        # Record Prometheus metrics (skip /metrics itself)
        if request.url.path != "/metrics":
            HTTP_REQUESTS_TOTAL.labels(
                method=request.method,
                endpoint=request.url.path,
                status_code=response.status_code,
            ).inc()
            HTTP_REQUEST_DURATION.labels(
                method=request.method,
                endpoint=request.url.path,
            ).observe(duration)

        response.headers["X-Request-ID"] = req_id
        return response
    finally:
        request_id_ctx_var.reset(token)


# Include API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)


# Metrics Endpoint
@app.get("/metrics", include_in_schema=False)
def get_metrics():
    """Prometheus metrics scrape target."""
    return metrics_endpoint()


@app.get("/health", tags=["Health"])
async def health_check():
    """System liveness and readiness probe endpoint."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": time.time(),
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
    }


# ==========================================
# WEBSOCKET REAL-TIME ENDPOINTS
# ==========================================


@app.websocket("/ws/deliveries/{delivery_id}")
async def websocket_delivery_tracking(websocket: WebSocket, delivery_id: str):
    """Real-time live location and order status stream for an active delivery."""
    await ws_manager.connect_delivery(delivery_id, websocket)
    try:
        while True:
            # Keep socket alive and handle incoming client messages if any
            data = await websocket.receive_text()
            logger.debug(f"WS delivery {delivery_id} client sent: {data}")
    except WebSocketDisconnect:
        ws_manager.disconnect_delivery(delivery_id, websocket)
    except Exception as e:
        logger.debug(f"WS delivery connection error: {str(e)}")
        ws_manager.disconnect_delivery(delivery_id, websocket)


@app.websocket("/ws/users/{user_id}")
async def websocket_user_notifications(websocket: WebSocket, user_id: str):
    """Real-time in-app notifications stream for a user."""
    await ws_manager.connect_user(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_user(user_id, websocket)
    except Exception as e:
        logger.debug(f"WS user connection error: {str(e)}")
        ws_manager.disconnect_user(user_id, websocket)


@app.websocket("/ws/admin")
async def websocket_admin_broadcast(websocket: WebSocket):
    """Real-time platform events feed for admin console."""
    await ws_manager.connect_admin(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_admin(websocket)
    except Exception:
        ws_manager.disconnect_admin(websocket)
