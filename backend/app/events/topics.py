class KafkaTopics:
    ORDER_CREATED = "order.created"
    ORDER_ACCEPTED = "order.accepted"
    ORDER_REJECTED = "order.rejected"
    ORDER_PREPARING = "order.preparing"
    ORDER_READY = "order.ready"

    DELIVERY_CREATED = "delivery.created"
    DELIVERY_ASSIGNED = "delivery.assigned"
    DELIVERY_PICKED_UP = "delivery.picked_up"
    DELIVERY_IN_TRANSIT = "delivery.in_transit"
    DELIVERY_DELIVERED = "delivery.delivered"

    DRIVER_LOCATION_UPDATED = "driver.location.updated"
    NOTIFICATION_CREATED = "notification.created"

    ALL_TOPICS = [
        ORDER_CREATED,
        ORDER_ACCEPTED,
        ORDER_REJECTED,
        ORDER_PREPARING,
        ORDER_READY,
        DELIVERY_CREATED,
        DELIVERY_ASSIGNED,
        DELIVERY_PICKED_UP,
        DELIVERY_IN_TRANSIT,
        DELIVERY_DELIVERED,
        DRIVER_LOCATION_UPDATED,
        NOTIFICATION_CREATED,
    ]
