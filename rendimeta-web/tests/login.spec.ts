import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test("redirects unauthenticated user to /login", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForURL("**/login**");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("text=Gas Logística")).toBeVisible();
  });

  test("shows login form and test users panel", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator("text=Acceso rápido de prueba")).toBeVisible();
    await expect(page.locator("text=Super Admin")).toBeVisible();
    await expect(page.locator("text=Despachador")).toBeVisible();
  });

  test("login with email/password works", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.fill('input[type="email"]', "admin@sistema.com");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button[type="submit"]');
    await page.waitForURL("http://localhost:3000/", { timeout: 10000 });
    await expect(page).toHaveURL("http://localhost:3000/");
  });

  test("quick login Super Admin button works", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.click("text=Super Admin");
    await page.waitForURL("http://localhost:3000/", { timeout: 10000 });
    await expect(page).toHaveURL("http://localhost:3000/");
  });

  test("logged in user sees dashboard and sidebar", async ({ page }) => {
    // Login first
    await page.goto("http://localhost:3000/login");
    await page.fill('input[type="email"]', "admin@sistema.com");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button[type="submit"]');
    await page.waitForURL("http://localhost:3000/", { timeout: 10000 });

    // Verify dashboard elements
    await expect(page.getByRole("heading", { name: "Vista General" })).toBeVisible();
    await expect(page.getByRole("link", { name: "RH General" })).toBeVisible();
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.fill('input[type="email"]', "admin@sistema.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Credenciales inválidas")).toBeVisible({
      timeout: 5000,
    });
  });

  test("logout works", async ({ page }) => {
    // Login
    await page.goto("http://localhost:3000/login");
    await page.click("text=Super Admin");
    await page.waitForURL("http://localhost:3000/", { timeout: 10000 });

    // Open user menu and click logout
    await page.getByRole("button", { name: /Admin/i }).click();
    await page.getByText("Cerrar sesión").click();
    await page.waitForURL("**/login**", { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
