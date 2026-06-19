import { test, expect, type Page } from "@playwright/test";

async function login(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "Password123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test("redirects anonymous users to the login page", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("admin can sign in and manage the team", async ({ page }) => {
  await login(page, "admin@acme.test");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.goto("/team");
  await expect(page.getByText("Invite a member")).toBeVisible();
});

test("employee cannot access the admin team page", async ({ page }) => {
  await login(page, "nurse@acme.test");
  await page.goto("/team");
  // role-gated: redirected back to the dashboard
  await expect(page).toHaveURL(/\/dashboard/);
});

test("employee sees their own requests page", async ({ page }) => {
  await login(page, "nurse@acme.test");
  await page.goto("/requests");
  await expect(page.getByRole("heading", { name: "My requests" })).toBeVisible();
});

test("privacy policy is publicly accessible", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page).toHaveURL(/\/privacy/);
  await expect(
    page.getByRole("heading", { name: "Privacy Policy" }),
  ).toBeVisible();
});

test("signup requires consent before submitting", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByText(/Privacy Policy/)).toBeVisible();
  const submit = page.getByRole("button", { name: "Create account" });
  await expect(submit).toBeDisabled();
});
