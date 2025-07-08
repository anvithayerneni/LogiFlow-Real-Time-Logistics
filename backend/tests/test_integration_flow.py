import pytest
from httpx import AsyncClient
from app.models.delivery import DeliveryStatus
from app.models.order import OrderStatus
from app.models.user import UserRole
from tests.conftest import auth_header_for


@pytest.mark.asyncio
async def test_full_12_step_delivery_lifecycle(
    client: AsyncClient,
    sample_restaurant,
    sample_restaurant_owner,
    sample_driver,
):
    driver_user, driver_entity = sample_driver

    # ----------------------------------------------------
    # Step 1: Customer registers
    # ----------------------------------------------------
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "lifecycle_customer@example.com",
            "password": "customerpass123",
            "full_name": "Lifecycle Customer",
            "role": UserRole.CUSTOMER,
        },
    )
    assert reg_res.status_code == 201

    # ----------------------------------------------------
    # Step 2: Customer logs in
    # ----------------------------------------------------
    login_res = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "lifecycle_customer@example.com",
            "password": "customerpass123",
        },
    )
    assert login_res.status_code == 200
    customer_token = login_res.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {customer_token}"}

    # ----------------------------------------------------
    # Step 3: Customer places order
    # ----------------------------------------------------
    menu_items_res = await client.get(f"/api/v1/restaurants/{sample_restaurant.id}/menu")
    assert menu_items_res.status_code == 200
    menu_item_id = menu_items_res.json()[0]["id"]

    order_payload = {
        "restaurant_id": sample_restaurant.id,
        "items": [
            {"menu_item_id": menu_item_id, "quantity": 2, "special_instructions": "Extra basil"}
        ],
        "customer_notes": "Apt 4B, ring buzzer",
    }
    create_order_res = await client.post("/api/v1/orders", json=order_payload, headers=cust_headers)
    assert create_order_res.status_code == 201
    order_data = create_order_res.json()
    order_id = order_data["id"]
    assert order_data["status"] == OrderStatus.CREATED
    assert order_data["total_amount"] > 0

    # ----------------------------------------------------
    # Step 4: Restaurant receives order
    # ----------------------------------------------------
    rest_headers = auth_header_for(sample_restaurant_owner)
    rest_orders_res = await client.get("/api/v1/orders", headers=rest_headers)
    assert rest_orders_res.status_code == 200
    rest_orders = rest_orders_res.json()
    assert any(o["id"] == order_id for o in rest_orders)

    # ----------------------------------------------------
    # Step 5: Restaurant accepts order
    # ----------------------------------------------------
    accept_order_res = await client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": OrderStatus.CONFIRMED},
        headers=rest_headers,
    )
    assert accept_order_res.status_code == 200
    assert accept_order_res.json()["status"] == OrderStatus.CONFIRMED

    # Advance to PREPARING
    prep_order_res = await client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": OrderStatus.PREPARING},
        headers=rest_headers,
    )
    assert prep_order_res.status_code == 200
    assert prep_order_res.json()["status"] == OrderStatus.PREPARING

    # ----------------------------------------------------
    # Step 6: Order becomes ready (READY_FOR_PICKUP)
    # ----------------------------------------------------
    ready_res = await client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": OrderStatus.READY_FOR_PICKUP},
        headers=rest_headers,
    )
    assert ready_res.status_code == 200
    assert ready_res.json()["status"] == OrderStatus.READY_FOR_PICKUP

    # ----------------------------------------------------
    # Step 7: Driver gets assigned (delivery created automatically)
    # ----------------------------------------------------
    deliv_res = await client.get(f"/api/v1/deliveries/by-order/{order_id}")
    assert deliv_res.status_code == 200
    delivery_data = deliv_res.json()
    delivery_id = delivery_data["id"]
    assert delivery_data["driver_id"] == driver_entity.id
    assert delivery_data["status"] == DeliveryStatus.ASSIGNED

    # ----------------------------------------------------
    # Step 8: Driver accepts delivery
    # ----------------------------------------------------
    driver_headers = auth_header_for(driver_user)
    accept_deliv_res = await client.post(
        f"/api/v1/deliveries/{delivery_id}/accept",
        headers=driver_headers,
    )
    assert accept_deliv_res.status_code == 200
    assert accept_deliv_res.json()["status"] == DeliveryStatus.ACCEPTED

    # Driver arrives & picks up
    arrive_res = await client.patch(
        f"/api/v1/deliveries/{delivery_id}/status",
        json={"status": DeliveryStatus.ARRIVED_AT_RESTAURANT},
        headers=driver_headers,
    )
    assert arrive_res.status_code == 200

    pickup_res = await client.patch(
        f"/api/v1/deliveries/{delivery_id}/status",
        json={"status": DeliveryStatus.PICKED_UP},
        headers=driver_headers,
    )
    assert pickup_res.status_code == 200
    assert pickup_res.json()["status"] == DeliveryStatus.PICKED_UP

    # ----------------------------------------------------
    # Step 9: Driver updates location (telemetry)
    # ----------------------------------------------------
    loc_payload = {
        "delivery_id": delivery_id,
        "latitude": 37.7915,
        "longitude": -122.3990,
        "speed": 32.0,
        "heading": 90.0,
    }
    loc_res = await client.post(
        "/api/v1/drivers/location",
        json=loc_payload,
        headers=driver_headers,
    )
    assert loc_res.status_code == 201
    assert loc_res.json()["delivery_id"] == delivery_id

    # ----------------------------------------------------
    # Step 10: Customer receives real-time location update (verified via delivery details)
    # ----------------------------------------------------
    cust_deliv_check = await client.get(f"/api/v1/deliveries/{delivery_id}", headers=cust_headers)
    assert cust_deliv_check.status_code == 200
    breadcrumbs = cust_deliv_check.json()["tracking_breadcrumbs"]
    assert len(breadcrumbs) >= 1
    assert breadcrumbs[-1]["latitude"] == 37.7915

    # Advance to IN_TRANSIT
    transit_res = await client.patch(
        f"/api/v1/deliveries/{delivery_id}/status",
        json={"status": DeliveryStatus.IN_TRANSIT},
        headers=driver_headers,
    )
    assert transit_res.status_code == 200

    # ----------------------------------------------------
    # Step 11: Driver delivers order
    # ----------------------------------------------------
    delivered_res = await client.patch(
        f"/api/v1/deliveries/{delivery_id}/status",
        json={"status": DeliveryStatus.DELIVERED},
        headers=driver_headers,
    )
    assert delivered_res.status_code == 200
    assert delivered_res.json()["status"] == DeliveryStatus.DELIVERED

    # ----------------------------------------------------
    # Step 12: Customer sees DELIVERED on order
    # ----------------------------------------------------
    final_order_res = await client.get(f"/api/v1/orders/{order_id}", headers=cust_headers)
    assert final_order_res.status_code == 200
    assert final_order_res.json()["status"] == OrderStatus.DELIVERED
