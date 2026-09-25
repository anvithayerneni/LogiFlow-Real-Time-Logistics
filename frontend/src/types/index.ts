export type UserRole = "CUSTOMER" | "RESTAURANT" | "DELIVERY_DRIVER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  display_order: number;
  items: MenuItem[];
}

export interface Restaurant {
  id: string;
  owner_id?: string;
  name: string;
  description?: string;
  cuisine_type: string;
  address: string;
  phone?: string;
  image_url?: string;
  latitude: number;
  longitude: number;
  rating: number;
  prep_time_minutes: number;
  is_active: boolean;
  categories: MenuCategory[];
  menu_items: MenuItem[];
}

export type OrderStatus =
  | "CREATED"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  special_instructions?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  restaurant_id: string;
  delivery_address_id?: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total_amount: number;
  customer_notes?: string;
  cancellation_reason?: string;
  estimated_prep_time_minutes: number;
  estimated_delivery_time?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  restaurant_name?: string;
  restaurant?: Restaurant;
  customer_name?: string;
  delivery_id?: string;
}

export type DeliveryStatus =
  | "PENDING"
  | "ASSIGNED"
  | "ACCEPTED"
  | "ARRIVED_AT_RESTAURANT"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

export interface DriverLocation {
  id: string;
  driver_id: string;
  delivery_id?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface Driver {
  id: string;
  user_id: string;
  vehicle_type: string;
  license_plate?: string;
  is_available: boolean;
  current_latitude?: number;
  current_longitude?: number;
  last_location_update?: string;
  rating: number;
  active_deliveries_count: number;
  full_name?: string;
  phone?: string;
}

export interface Delivery {
  id: string;
  order_id: string;
  driver_id?: string;
  status: DeliveryStatus;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_latitude: number;
  dropoff_longitude: number;
  estimated_pickup_time?: string;
  estimated_delivery_time?: string;
  actual_pickup_time?: string;
  actual_delivery_time?: string;
  distance_km: number;
  created_at: string;
  updated_at: string;
  driver?: Driver;
  order?: Order;
  tracking_breadcrumbs: DriverLocation[];
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  metadata_json?: string;
  created_at: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}
