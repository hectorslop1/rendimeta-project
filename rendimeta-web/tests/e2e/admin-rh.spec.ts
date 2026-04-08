import { expect, test, type Page } from "@playwright/test";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "modulo";
}

async function quickLoginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByTestId("quick-login-admin@sistema.com").click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe("Administración y RH", () => {
  test("mantiene RH y Administración como navegación horizontal y fuera del sidebar", async ({
    page,
  }) => {
    await quickLoginAsAdmin(page);

    await page.goto("/");
    await expect(page.getByTestId("module-tab-rh-employees")).toHaveCount(0);
    await expect(page.getByTestId("module-tab-admin-users")).toHaveCount(0);
    await expect(page.getByTestId("sidebar-section-rh")).toBeVisible();
    await expect(page.getByTestId("sidebar-section-admin")).toBeVisible();
    await expect(page.getByTestId("sidebar-productivity-system")).toContainText(
      "Sistema de Productividad"
    );

    const analyticsBox = await page.getByTestId("sidebar-group-analytics").boundingBox();
    const productivityBox = await page.getByTestId("sidebar-productivity-system").boundingBox();
    expect(analyticsBox && productivityBox && productivityBox.y > analyticsBox.y).toBeTruthy();

    await page.goto("/rh/seguimiento-horario");
    await expect(page.getByRole("heading", { name: "Seguimiento Horario" })).toBeVisible();
    await expect(page.getByTestId("module-tab-rh-employees")).toBeVisible();
    await expect(page.getByTestId("sidebar-item-rh-employees")).toHaveCount(0);

    await page.goto("/admin/usuarios");
    await expect(page.getByRole("heading", { name: "Gestión de Usuarios" })).toBeVisible();
    await expect(page.getByTestId("module-tab-admin-users")).toBeVisible();
    await expect(page.getByTestId("sidebar-item-admin-users")).toHaveCount(0);
  });

  test("permite crear una sección horizontal y una opción managed desde mantenimiento", async ({
    page,
  }) => {
    await quickLoginAsAdmin(page);

    const nonce = Date.now().toString().slice(-6);
    const templateName = `Menu QA ${nonce}`;
    const sectionTitle = `Mantenimiento ${nonce}`;
    const itemTitle = `Checklist Diario ${nonce}`;
    const sectionId = slugify(sectionTitle);
    const itemId = slugify(`${sectionId}-${itemTitle}`);
    const managedHref = `/modulos/${slugify(sectionTitle)}/${slugify(itemTitle)}`;

    await page.goto("/admin/configuracion");
    await page.getByTestId("config-tab-menu").click();

    await page.getByTestId("new-section-title").fill(sectionTitle);
    await page.getByTestId("new-section-description").fill(
      "Módulos configurables de mantenimiento"
    );
    await page.getByTestId("new-section-presentation").selectOption("horizontal");
    await page.getByTestId("add-navigation-section").click();

    await expect(page.getByTestId("editor-group-productivity-system")).toBeVisible();
    await expect(page.getByTestId(`editor-entry-section-${sectionId}`)).toBeVisible();
    await page.getByTestId(`editor-entry-section-${sectionId}`).click();

    await page.getByTestId("new-item-title").fill(itemTitle);
    await expect(page.getByTestId("new-item-icon-picker")).toBeVisible();
    await expect(page.getByTestId("new-item-icon-option-wrench").locator("svg")).toBeVisible();
    await page.getByTestId("new-item-icon-option-wrench").click();
    await page.getByTestId("new-item-min-level").fill("3");
    await page.getByTestId("add-navigation-item").click();

    await page.getByTestId("new-navigation-template-name").fill(templateName);
    await page.getByTestId("save-navigation-template-as-new").click();
    await expect(page.getByTestId("navigation-template-select")).toHaveValue(
      `menu-qa-${nonce}`
    );

    const sectionShortcut = page.getByTestId(`sidebar-section-${sectionId}`);
    await expect(sectionShortcut).toBeVisible();
    await sectionShortcut.click();

    const managedTab = page.getByTestId(`module-tab-${itemId}`);
    await expect(managedTab).toBeVisible();
    await expect(page.getByTestId(`sidebar-item-${itemId}`)).toHaveCount(0);

    await managedTab.click();
    await expect(page).toHaveURL(managedHref);
    await expect(page.getByRole("heading", { name: itemTitle })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: itemTitle })).toBeVisible();

    await page.goto("/admin/configuracion");
    await page.getByTestId("config-tab-menu").click();
    await page.getByTestId("navigation-template-select").selectOption({ label: "Menu Base" });
    await expect(page.getByTestId("navigation-template-select")).toHaveValue("menu-base");
    await expect(page.getByTestId(`sidebar-section-${sectionId}`)).toHaveCount(0);
  });

  test("muestra y permite seleccionar los módulos internos de los menús horizontales en mantenimiento", async ({
    page,
  }) => {
    await quickLoginAsAdmin(page);

    await page.goto("/admin/configuracion");
    await page.getByTestId("config-tab-menu").click();
    await page.getByTestId("editor-group-productivity-system").click();

    await expect(page.getByTestId("editor-entry-section-rh")).toBeVisible();
    await expect(page.getByTestId("editor-entry-item-rh-overview")).toBeVisible();
    await expect(page.getByTestId("editor-entry-item-rh-hourly")).toBeVisible();
    await expect(page.getByTestId("editor-entry-section-admin")).toBeVisible();
    await expect(page.getByTestId("editor-entry-item-admin-users")).toBeVisible();
    await expect(page.getByTestId("editor-entry-item-admin-settings")).toBeVisible();

    await page.getByTestId("editor-entry-item-admin-settings").click();
    await expect(page.locator('input[value="Configuración"]').first()).toBeVisible();
    await expect(page.locator('input[value="/admin/configuracion"]').first()).toBeVisible();
    await expect(page.getByTestId("item-icon-picker")).toBeVisible();
    await expect(page.getByTestId("item-icon-option-settings").locator("svg")).toBeVisible();
  });

  test("aplica un theme oscuro desde configuracion", async ({ page }) => {
    await quickLoginAsAdmin(page);

    await page.goto("/admin/configuracion");
    await page.getByTestId("config-tab-themes").click();
    await page.getByTestId("theme-preset-midnight").click();
    await page.getByTestId("apply-theme-button").click();

    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByText("Theme aplicado correctamente.")).toBeVisible();
  });
});
