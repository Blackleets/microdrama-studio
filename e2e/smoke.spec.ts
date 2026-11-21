import { expect, test } from "@playwright/test";

test("root route opens the streaming catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/streaming\/?$/);
  await expect(page.getByRole("heading", { name: /La última/ })).toBeVisible();
});

test("Studio exposes local workspace and production navigation", async ({ page }) => {
  await page.goto("/studio");
  await expect(page.getByText("LOCAL WORKSPACE")).toBeVisible();
  await expect(page.getByRole("button", { name: "Exportar copia de seguridad" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Post Production/ })).toBeVisible();
});

test("asset registry and post-production routes render", async ({ page }) => {
  await page.goto("/studio/assets");
  await expect(page.getByRole("heading", { name: /Media Asset Registry/ })).toBeVisible();

  await page.goto("/studio/post-production");
  await expect(page.getByText("Selecciona un episodio")).toBeVisible();
});

test("Gemini endpoint stays disabled without a server access token", async ({ request }) => {
  const response = await request.post("/api/local/story", {
    data: { series: { title: "Prueba" }, episode: { title: "Episodio" } },
  });
  expect(response.status()).toBe(503);
  const body = await response.json();
  expect(body.error).toBe("token_not_configured");
});
