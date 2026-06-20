import { test, expect, type Page } from "@playwright/test";

async function login(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "Password123!");
  await page.click('button[type="submit"]');
}

test("redirects anonymous users to the login page", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("super-admin signs in and reaches the platform dashboard", async ({
  page,
}) => {
  await login(page, "super@leavicy.test");
  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  // A platform stat card is shown
  await expect(page.getByText("Tenants").first()).toBeVisible();
});

test("super-admin can open the tenants management page", async ({ page }) => {
  await login(page, "super@leavicy.test");
  await page.waitForURL("**/dashboard");
  await page.goto("/tenants");
  await expect(page.getByRole("heading", { name: "Tenants" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create tenant" }),
  ).toBeVisible();
});

test("a tenant admin is denied access to Central", async ({ page }) => {
  await login(page, "admin@acme.test");
  // Not a platform admin -> the layout guard bounces them to /login.
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
