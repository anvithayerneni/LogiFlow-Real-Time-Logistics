import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, init_db
from app.core.logging import logger, setup_logging
from app.core.security import hash_password
from app.models.user import Address, User, UserRole
from app.models.delivery import Delivery, DeliveryStatus
from app.models.driver import Driver, DriverLocation
from app.models.notification import Notification, NotificationType
from app.models.order import Order, OrderItem, OrderStatus
from app.models.payment import Payment, PaymentStatus
from app.models.restaurant import MenuCategory, MenuItem, Restaurant

setup_logging(debug=False)


async def seed_database() -> None:
    logger.info("Initializing database schema...")
    await init_db()

    async with AsyncSessionLocal() as session:
        # Check if already seeded
        existing_users = await session.execute(select(User))
        if existing_users.scalars().first():
            logger.info("Database already contains data. Skipping seed.")
            return

        logger.info("Seeding users (Admin, Restaurants, Drivers, Customers)...")
        pw_hash = hash_password("password123")

        # 1. Admin
        admin = User(
            email="admin@deliveryplatform.com",
            hashed_password=pw_hash,
            full_name="Alex Vance (Admin)",
            phone="+1-555-0100",
            role=UserRole.ADMIN,
        )
        session.add(admin)

        # 2. Restaurant Owners
        rest_owners = []
        for i in range(1, 6):
            owner = User(
                email=f"owner{i}@restaurant.com",
                hashed_password=pw_hash,
                full_name=f"Chef Owner #{i}",
                phone=f"+1-555-020{i}",
                role=UserRole.RESTAURANT,
            )
            session.add(owner)
            rest_owners.append(owner)

        # 3. 10 Delivery Drivers
        drivers_data = [
            ("Marcus Chen", "car", "CA-7XYZ91", 37.7749, -122.4194, 4.95),
            ("Sarah Jenkins", "scooter", "CA-3ABC42", 37.7833, -122.4167, 4.88),
            ("David Rodriguez", "car", "CA-9LMN55", 37.7690, -122.4467, 4.92),
            ("Amina Patel", "bicycle", "BIKE-SF04", 37.7785, -122.4212, 4.97),
            ("James O'Connor", "car", "CA-5QWE88", 37.7891, -122.4014, 4.85),
            ("Elena Rostova", "scooter", "CA-2RTY33", 37.7600, -122.4350, 4.90),
            ("Tariq Al-Mansoor", "car", "CA-8UIO12", 37.7520, -122.4180, 4.89),
            ("Maya Lin", "bicycle", "BIKE-SF08", 37.7850, -122.4350, 4.98),
            ("Lucas Silva", "car", "CA-4PAS99", 37.7680, -122.4100, 4.86),
            ("Chloe Bennett", "car", "CA-6DFG77", 37.7920, -122.3980, 4.94),
        ]
        driver_entities = []
        for idx, (name, vtype, plate, lat, lng, rating) in enumerate(drivers_data, 1):
            d_user = User(
                email=f"driver{idx}@driver.com",
                hashed_password=pw_hash,
                full_name=name,
                phone=f"+1-555-03{idx:02d}",
                role=UserRole.DELIVERY_DRIVER,
            )
            session.add(d_user)
            await session.flush()

            driver = Driver(
                user_id=d_user.id,
                vehicle_type=vtype,
                license_plate=plate,
                is_available=True,
                current_latitude=lat,
                current_longitude=lng,
                last_location_update=datetime.now(timezone.utc),
                rating=rating,
            )
            session.add(driver)
            driver_entities.append(driver)

        # 4. 10 Customers with sample delivery addresses
        customers = []
        customer_addresses = []
        customers_info = [
            ("Emily Watson", "emily@customer.com", "742 Montgomery St", 37.7952, -122.4029),
            ("Michael Chang", "michael@customer.com", "555 California St", 37.7925, -122.4042),
            ("Jessica Taylor", "jessica@customer.com", "100 Van Ness Ave", 37.7766, -122.4190),
            ("Brian Murphy", "brian@customer.com", "300 Howard St", 37.7890, -122.3960),
            ("Samantha Lee", "samantha@customer.com", "888 Brannan St", 37.7712, -122.4045),
            ("Daniel Kim", "daniel@customer.com", "1250 Folsom St", 37.7735, -122.4110),
            ("Olivia Garcia", "olivia@customer.com", "450 Sutter St", 37.7896, -122.4072),
            ("William Harris", "william@customer.com", "201 Mission St", 37.7915, -122.3955),
            ("Sophia Martinez", "sophia@customer.com", "750 Geary St", 37.7865, -122.4172),
            ("Ethan Walker", "ethan@customer.com", "1800 Market St", 37.7710, -122.4245),
        ]
        for name, email, street, lat, lng in customers_info:
            c_user = User(
                email=email,
                hashed_password=pw_hash,
                full_name=name,
                phone="+1-555-0499",
                role=UserRole.CUSTOMER,
            )
            session.add(c_user)
            await session.flush()
            customers.append(c_user)

            addr = Address(
                user_id=c_user.id,
                label="Home",
                street=street,
                city="San Francisco",
                state="CA",
                postal_code="94105",
                latitude=lat,
                longitude=lng,
                is_default=True,
            )
            session.add(addr)
            customer_addresses.append(addr)

        await session.flush()

        # 5. 5 Restaurants with >30 Menu items
        logger.info("Seeding 5 restaurants and 30+ menu items...")
        restaurants_catalog = [
            {
                "name": "Bella Napoli Trattoria",
                "cuisine": "Italian",
                "description": "Authentic wood-fired Neapolitan pizza, handmade pastas, and classic rustic Italian dishes.",
                "address": "452 Columbus Ave, San Francisco, CA",
                "lat": 37.7989,
                "lon": -122.4075,
                "rating": 4.9,
                "prep": 25,
                "categories": [
                    {
                        "name": "Wood-Fired Pizzas",
                        "items": [
                            (
                                "Margherita D.O.P.",
                                "San Marzano tomatoes, fresh buffalo mozzarella, basil, EVOO",
                                19.50,
                            ),
                            (
                                "Diavola Piccante",
                                "Spicy calabrian salami, crushed red pepper, mozzarella",
                                22.00,
                            ),
                            (
                                "Tartufo & Funghi",
                                "Wild forest mushrooms, white truffle cream, fontina cheese",
                                24.50,
                            ),
                            (
                                "Quattro Formaggi",
                                "Gorgonzola dolce, fontina, parmigiano reggiano, mozzarella",
                                21.00,
                            ),
                        ],
                    },
                    {
                        "name": "Handmade Pastas",
                        "items": [
                            (
                                "Tagliatelle Bolognese",
                                "Slow-braised beef and pork ragu, 24-month parmigiano",
                                23.00,
                            ),
                            (
                                "Cacio e Pepe",
                                "Handcrafted tonnarelli, pecorino romano, toasted black pepper",
                                18.50,
                            ),
                            (
                                "Lobster Ravioli",
                                "Maine lobster, sweet corn bisque, fresh tarragon",
                                27.00,
                            ),
                        ],
                    },
                    {
                        "name": "Desserts",
                        "items": [
                            (
                                "Classic Tiramisu",
                                "Savoiardi soaked in espresso, mascarpone zabaglione",
                                9.50,
                            ),
                        ],
                    },
                ],
            },
            {
                "name": "Tokyo Ramen & Robata",
                "cuisine": "Japanese",
                "description": "Rich 18-hour tonkotsu broth, silky hand-pulled noodles, and charcoal-grilled skewers.",
                "address": "620 Post St, San Francisco, CA",
                "lat": 37.7876,
                "lon": -122.4118,
                "rating": 4.8,
                "prep": 20,
                "categories": [
                    {
                        "name": "Signature Ramen",
                        "items": [
                            (
                                "Black Garlic Tonkotsu",
                                "18-hr pork bone broth, charred garlic oil, chashu pork belly",
                                18.00,
                            ),
                            (
                                "Spicy Miso Ramen",
                                "Fermented red miso, ground pork tantan, chili oil, soft egg",
                                18.50,
                            ),
                            (
                                "Truffle Shoyu Ramen",
                                "Clear chicken dashi, black truffle butter, menma, scallions",
                                19.50,
                            ),
                        ],
                    },
                    {
                        "name": "Appetizers & Robata",
                        "items": [
                            (
                                "Kurobuta Pork Gyoza",
                                "Pan-fried Japanese dumplings with scallion ponzu",
                                9.00,
                            ),
                            (
                                "Chicken Karaage",
                                "Crispy Japanese fried chicken, yuzu kosho mayo",
                                11.50,
                            ),
                            (
                                "Yakitori Platter",
                                "Skewered chicken thigh with scallion and sweet tare sauce",
                                14.00,
                            ),
                        ],
                    },
                ],
            },
            {
                "name": "El Fuego Cantina",
                "cuisine": "Mexican",
                "description": "Vibrant Mexican street food, fresh hand-pressed heirloom corn tortillas, and smoky salsas.",
                "address": "2201 Mission St, San Francisco, CA",
                "lat": 37.7610,
                "lon": -122.4190,
                "rating": 4.7,
                "prep": 15,
                "categories": [
                    {
                        "name": "Street Tacos",
                        "items": [
                            (
                                "Al Pastor Tacos (Trio)",
                                "Spit-roasted marinated pork, charred pineapple, cilantro",
                                15.00,
                            ),
                            (
                                "Carne Asada Tacos (Trio)",
                                "Citrus-marinated skirt steak, salsa verde, white onion",
                                16.50,
                            ),
                            (
                                "Baja Crispy Fish Tacos",
                                "Pacific rockfish in beer batter, chipotle crema, slaw",
                                16.00,
                            ),
                            (
                                "Birria Quesatacos",
                                "Braised beef short rib, melted Oaxaca cheese, rich consommé",
                                17.50,
                            ),
                        ],
                    },
                    {
                        "name": "Platos & Sides",
                        "items": [
                            (
                                "Mission Burrito Supremo",
                                "Pinto beans, seasoned rice, guacamole, crema, salsa",
                                14.50,
                            ),
                            (
                                "Fresh Guacamole & Chips",
                                "Hass avocado, serrano, lime, cilantro, house tortilla chips",
                                8.50,
                            ),
                            (
                                "Elote Street Corn",
                                "Grilled sweet corn, cotija cheese, chili powder, lime",
                                6.50,
                            ),
                        ],
                    },
                ],
            },
            {
                "name": "Golden Gate Burger Joint",
                "cuisine": "American",
                "description": "Prime dry-aged smash burgers, hand-spun shakes, and golden crinkle-cut fries.",
                "address": "810 Valencia St, San Francisco, CA",
                "lat": 37.7595,
                "lon": -122.4215,
                "rating": 4.9,
                "prep": 15,
                "categories": [
                    {
                        "name": "Signature Burgers",
                        "items": [
                            (
                                "The Double Smash Classic",
                                "Two prime beef patties, American cheese, grilled onions, secret sauce",
                                14.00,
                            ),
                            (
                                "Truffle Bacon Cheeseburger",
                                "Thick-cut applewood bacon, black truffle aioli, aged cheddar",
                                16.50,
                            ),
                            (
                                "Crispy Hot Honey Chicken",
                                "Buttermilk-brined fried chicken breast, hot honey glaze, dill pickles",
                                15.00,
                            ),
                            (
                                "Beyond Smash Vegan Burger",
                                "Plant-based patty, vegan cheddar, butter lettuce, tomato, special sauce",
                                15.50,
                            ),
                        ],
                    },
                    {
                        "name": "Fries & Shakes",
                        "items": [
                            (
                                "Parmesan Truffle Fries",
                                "Crispy hand-cut fries, parmigiano, white truffle oil",
                                7.50,
                            ),
                            (
                                "Bourbon Vanilla Milkshake",
                                "Hand-spun vanilla custard, Madagascar bourbon vanilla bean",
                                7.00,
                            ),
                        ],
                    },
                ],
            },
            {
                "name": "Green Garden Bistro & Bowls",
                "cuisine": "Healthy & Organic",
                "description": "Nutrient-dense superfood bowls, cold-pressed juices, and chef-curated grain salads.",
                "address": "301 King St, San Francisco, CA",
                "lat": 37.7760,
                "lon": -122.3940,
                "rating": 4.8,
                "prep": 12,
                "categories": [
                    {
                        "name": "Superfood Bowls",
                        "items": [
                            (
                                "Mediterranean Salmon Bowl",
                                "Wild salmon, quinoa, cucumber, kalamata olives, tahini dill",
                                18.00,
                            ),
                            (
                                "Spicy Tofu & Avocado Crunch",
                                "Crispy organic tofu, warm brown rice, pickled carrots, spicy ginger",
                                15.50,
                            ),
                            (
                                "Sweet Potato & Black Bean Bowl",
                                "Roasted yam, charred corn, black beans, chimichurri",
                                14.50,
                            ),
                        ],
                    },
                    {
                        "name": "Smoothies & Tonics",
                        "items": [
                            (
                                "Green Glow Smoothie",
                                "Spinach, pineapple, banana, coconut water, chia seeds",
                                8.50,
                            ),
                            (
                                "Acai Antioxidant Blast",
                                "Organic acai, blueberries, almond butter, hemp protein",
                                9.00,
                            ),
                        ],
                    },
                ],
            },
        ]

        restaurants_list = []
        all_menu_items = []
        for i, rest_data in enumerate(restaurants_catalog):
            restaurant = Restaurant(
                owner_id=rest_owners[i].id,
                name=rest_data["name"],
                description=rest_data["description"],
                cuisine_type=rest_data["cuisine"],
                address=rest_data["address"],
                phone="+1-555-8822",
                image_url="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
                latitude=rest_data["lat"],
                longitude=rest_data["lon"],
                rating=rest_data["rating"],
                prep_time_minutes=rest_data["prep"],
            )
            session.add(restaurant)
            await session.flush()
            restaurants_list.append(restaurant)

            for order_idx, cat_data in enumerate(rest_data["categories"]):
                category = MenuCategory(
                    restaurant_id=restaurant.id,
                    name=cat_data["name"],
                    display_order=order_idx,
                )
                session.add(category)
                await session.flush()

                for item_name, desc, price in cat_data["items"]:
                    m_item = MenuItem(
                        restaurant_id=restaurant.id,
                        category_id=category.id,
                        name=item_name,
                        description=desc,
                        price=price,
                        is_available=True,
                    )
                    session.add(m_item)
                    all_menu_items.append(m_item)

        await session.flush()

        # 6. Sample completed orders for historical data & admin analytics
        logger.info("Seeding completed order history and sample active delivery...")
        now = datetime.now(timezone.utc)
        for i in range(15):
            cust = customers[i % len(customers)]
            addr = customer_addresses[i % len(customer_addresses)]
            rest = restaurants_list[i % len(restaurants_list)]
            driver = driver_entities[i % len(driver_entities)]

            order_time = now - timedelta(days=(i % 6) + 1, hours=(i % 12))
            hist_order = Order(
                customer_id=cust.id,
                restaurant_id=rest.id,
                delivery_address_id=addr.id,
                status=OrderStatus.DELIVERED,
                subtotal=38.50,
                delivery_fee=3.99,
                tax=3.18,
                total_amount=45.67,
                customer_notes="Please leave at front door",
                estimated_prep_time_minutes=20,
                estimated_delivery_time=order_time + timedelta(minutes=35),
                created_at=order_time,
                updated_at=order_time + timedelta(minutes=35),
            )
            session.add(hist_order)
            await session.flush()

            # Order items
            oi = OrderItem(
                order_id=hist_order.id,
                item_name="Deluxe Combo Meal",
                unit_price=19.25,
                quantity=2,
                total_price=38.50,
            )
            session.add(oi)

            # Payment
            pm = Payment(
                order_id=hist_order.id,
                amount=45.67,
                currency="USD",
                status=PaymentStatus.CAPTURED,
                transaction_id=f"txn_hist_{i}_{hist_order.id[:8]}",
                provider="MOCK_PAYMENT_GATEWAY",
                created_at=order_time,
            )
            session.add(pm)

            # Delivery record
            deliv = Delivery(
                order_id=hist_order.id,
                driver_id=driver.id,
                status=DeliveryStatus.DELIVERED,
                pickup_latitude=rest.latitude,
                pickup_longitude=rest.longitude,
                dropoff_latitude=addr.latitude,
                dropoff_longitude=addr.longitude,
                actual_pickup_time=order_time + timedelta(minutes=15),
                actual_delivery_time=order_time + timedelta(minutes=32),
                distance_km=3.4,
                created_at=order_time,
                updated_at=order_time + timedelta(minutes=32),
            )
            session.add(deliv)

        # 7. Sample active delivery (SHOWCASE DEMO)
        # Customer: Emily Watson, Restaurant: Bella Napoli, Driver: Marcus Chen
        active_customer = customers[0]
        active_addr = customer_addresses[0]
        active_rest = restaurants_list[0]
        active_driver = driver_entities[0]
        active_driver.is_available = False
        active_driver.active_deliveries_count = 1

        active_order = Order(
            customer_id=active_customer.id,
            restaurant_id=active_rest.id,
            delivery_address_id=active_addr.id,
            status=OrderStatus.OUT_FOR_DELIVERY,
            subtotal=41.50,
            delivery_fee=3.49,
            tax=3.42,
            total_amount=48.41,
            customer_notes="Gate code #4491, ring doorbell please",
            estimated_prep_time_minutes=25,
            estimated_delivery_time=now + timedelta(minutes=14),
            created_at=now - timedelta(minutes=22),
            updated_at=now - timedelta(minutes=5),
        )
        session.add(active_order)
        await session.flush()

        # Add items to active order
        session.add(
            OrderItem(
                order_id=active_order.id,
                item_name="Margherita D.O.P.",
                unit_price=19.50,
                quantity=1,
                total_price=19.50,
            )
        )
        session.add(
            OrderItem(
                order_id=active_order.id,
                item_name="Diavola Piccante",
                unit_price=22.00,
                quantity=1,
                total_price=22.00,
            )
        )

        # Payment for active order
        session.add(
            Payment(
                order_id=active_order.id,
                amount=48.41,
                status=PaymentStatus.CAPTURED,
                transaction_id=f"txn_active_{active_order.id[:8]}",
                created_at=now - timedelta(minutes=22),
            )
        )

        # Active Delivery record
        active_delivery = Delivery(
            order_id=active_order.id,
            driver_id=active_driver.id,
            status=DeliveryStatus.IN_TRANSIT,
            pickup_latitude=active_rest.latitude,
            pickup_longitude=active_rest.longitude,
            dropoff_latitude=active_addr.latitude,
            dropoff_longitude=active_addr.longitude,
            actual_pickup_time=now - timedelta(minutes=8),
            distance_km=2.8,
            estimated_pickup_time=now - timedelta(minutes=10),
            estimated_delivery_time=now + timedelta(minutes=14),
            created_at=now - timedelta(minutes=20),
        )
        session.add(active_delivery)
        await session.flush()

        # Add GPS breadcrumb path for active delivery
        # From restaurant towards customer
        lat_step = (active_addr.latitude - active_rest.latitude) / 5.0
        lon_step = (active_addr.longitude - active_rest.longitude) / 5.0
        for step in range(4):
            b_lat = active_rest.latitude + (lat_step * step)
            b_lon = active_rest.longitude + (lon_step * step)
            breadcrumb = DriverLocation(
                driver_id=active_driver.id,
                delivery_id=active_delivery.id,
                latitude=round(b_lat, 6),
                longitude=round(b_lon, 6),
                speed=28.5,
                heading=45.0,
                timestamp=now - timedelta(minutes=(7 - step * 2)),
            )
            session.add(breadcrumb)
            active_driver.current_latitude = b_lat
            active_driver.current_longitude = b_lon

        # Add initial notifications
        session.add(
            Notification(
                user_id=active_customer.id,
                title="Order Out For Delivery",
                message=f"Driver Marcus Chen has picked up your food from {active_rest.name} and is on the way!",
                notification_type=NotificationType.DELIVERY_UPDATE,
                metadata_json=f'{{"order_id": "{active_order.id}", "delivery_id": "{active_delivery.id}"}}',
            )
        )

        await session.commit()
        logger.info(f"Database successfully seeded! Active showcase order ID: {active_order.id}")


if __name__ == "__main__":
    asyncio.run(seed_database())
