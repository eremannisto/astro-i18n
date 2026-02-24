import { test, expect } from "@playwright/test"

test.describe("client detection", () => {
  test("/ serves static html with redirect script", async ({ page }) => {
    const response = await page.goto("/")
    expect(response?.status()).toBe(200)
  })

  test("/ redirects to /en/ based on navigator.language", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "language", { get: () => "en" })
    })
    await page.goto("/")
    await page.waitForURL("/en/")
    await expect(page).toHaveURL("/en/")
  })

  test("/ redirects to /fi/ based on navigator.language", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "language", { get: () => "fi" })
    })
    await page.goto("/")
    await page.waitForURL("/fi/")
    await expect(page).toHaveURL("/fi/")
  })

  test("/ redirects to fallback /en/ for unknown language", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "language", { get: () => "de" })
    })
    await page.goto("/")
    await page.waitForURL("/en/")
    await expect(page).toHaveURL("/en/")
  })

  test("return visit / uses localStorage locale", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("locale", "fi")
    })
    await page.goto("/")
    await page.waitForURL("/fi/")
    await expect(page).toHaveURL("/fi/")
  })

  test("/en/ serves correct page", async ({ page }) => {
    await page.goto("/en/")
    await expect(page.locator("h1")).toHaveText("Home")
  })

  test("/fi/ serves correct page", async ({ page }) => {
    await page.goto("/fi/")
    await expect(page.locator("h1")).toHaveText("Etusivu")
  })
})
