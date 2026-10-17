import { expect, test } from "@playwright/test"

test.describe("base without a default locale prefix", () => {
  test("renders the default locale home page at the base", async ({ page }) => {
    const response = await page.goto("/docs/")
    expect(response?.status()).toBe(200)
    await expect(page.getByTestId("title")).toHaveText("Home")
    await expect(page).toHaveURL("/docs/")
  })

  test("renders a default locale page without a prefix", async ({ page }) => {
    const response = await page.goto("/docs/about")
    expect(response?.status()).toBe(200)
    await expect(page.getByTestId("title")).toHaveText("About")
  })

  test("renders another locale with a prefix", async ({ page }) => {
    const response = await page.goto("/docs/fi/about")
    expect(response?.status()).toBe(200)
    await expect(page.getByTestId("title")).toHaveText("Tietoa")
  })

  test("renders a page outside the [locale] folder", async ({ page }) => {
    const response = await page.goto("/docs/privacy")
    expect(response?.status()).toBe(200)
    await expect(page.getByTestId("title")).toHaveText("Privacy")
  })

  for (const path of ["/docs/en/about", "/docs/banana", "/docs/fi/banana"]) {
    test(`renders the 404 page for ${path}`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(404)
      await expect(page.getByTestId("not-found")).toHaveText("404")
    })
  }

  test("adds the base to links", async ({ page }) => {
    await page.goto("/docs/")
    await expect(page.getByTestId("about")).toHaveAttribute("href", "/docs/about")
    await page.goto("/docs/fi/")
    await expect(page.getByTestId("about")).toHaveAttribute("href", "/docs/fi/about")
  })
})

test.describe("language switcher with base", () => {
  test("switches to another locale and back to the default locale", async ({ page }) => {
    await page.goto("/docs/")
    await page.getByTestId("switch-fi").click()
    await expect(page).toHaveURL("/docs/fi/")
    await page.getByTestId("switch-en").click()
    await expect(page).toHaveURL("/docs/")
  })
})
