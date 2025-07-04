import { redirect } from "next/navigation";

export default function RestaurantIndexPage() {
  redirect("/restaurant/orders");
}
