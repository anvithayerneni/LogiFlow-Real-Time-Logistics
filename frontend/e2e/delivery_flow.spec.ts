import { test, expect } from "@playwright/test";

test.describe("Real-Time Delivery & Logistics Platform E2E Flow", () => {
  test("1. Landing page loads with role selector", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/LogiFlow/);
    await expect(page.locator("h1")).toContainText("Real-Time Delivery");
    await expect(page.getByText("Customer Portal")).toBeVisible();
    await expect(page.getByText("Kitchen Dispatch")).toBeVisible();
    await expect(page.getByText("Courier Cockpit")).toBeVisible();
    await expect(page.getByText("Operations Control")).toBeVisible();
  });

  test("2. Customer can log in and browse restaurants", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Sign In to LogiFlow")).toBeVisible();

    // Click demo login button
    await page.getByText("Customer Demo").click();
    await expect(page).toHaveURL(/.*\/customer\/restaurants/);
    await expect(page.getByText("Available Restaurants")).toBeVisible();
  });

  test("3. Customer can view restaurant menu and add to cart", async ({ page }) => {
    await page.goto("/customer/restaurants");
    // Click first restaurant
    const firstRestaurant = page.locator("a[href*='/customer/restaurants/']").first();
    await firstRestaurant.click();

    await expect(page.getByText("Menu Items")).toBeVisible();
    // Click add to cart
    const addBtn = page.locator("button[title='Add to cart']").first();
    await addBtn.click();

    // Verify floating cart badge or bar appears
    await expect(page.getByText("Proceed to Checkout")).toBeVisible();
  });

  test("4. Operations Telemetry Dashboard renders correctly", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText("Operations Telemetry & Control")).toBeVisible();
    await expect(page.getByText("Infrastructure Health Status")).toBeVisible();
    await expect(page.getByText("PostgreSQL")).toBeVisible();
    await expect(page.getByText("Kafka Bus")).toBeVisible();
  });
});
