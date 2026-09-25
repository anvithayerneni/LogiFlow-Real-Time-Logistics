from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response

# HTTP metrics
HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total count of HTTP requests",
    ["method", "endpoint", "status_code"],
)

HTTP_REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
)

# Domain Metrics
ORDERS_CREATED_TOTAL = Counter(
    "orders_created_total",
    "Total count of orders created",
    ["restaurant_id"],
)

ORDERS_COMPLETED_TOTAL = Counter(
    "orders_completed_total",
    "Total count of orders successfully completed",
)

DELIVERIES_COMPLETED_TOTAL = Counter(
    "deliveries_completed_total",
    "Total count of deliveries successfully completed",
)

ACTIVE_DRIVERS = Gauge(
    "active_drivers",
    "Current number of available drivers",
)

ACTIVE_DELIVERIES = Gauge(
    "active_deliveries",
    "Current number of in-flight deliveries",
)

KAFKA_EVENTS_PROCESSED_TOTAL = Counter(
    "kafka_events_processed_total",
    "Total Kafka events processed by services",
    ["topic", "status"],
)


def metrics_endpoint() -> Response:
    """Exposes Prometheus metrics endpoint"""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
