import { test, expect } from "@playwright/test"

test.describe("detection: none", () => {
  test("/en/ serves correct page", async ({ page }) => {
    await page.goto("/en/")
    await expect(page.locator("h1")).toHaveText("Home")
  })

  test("/fi/ serves correct page", async ({ page }) => {
    await page.goto("/fi/")
    await expect(page.locator("h1")).toHaveText("Etusivu")
  })

  test("/en/about serves correct page", async ({ page }) => {
    await page.goto("/en/about")
    await expect(page.locator("h1")).toHaveText("About")
  })

  test("/fi/about serves correct page", async ({ page }) => {
    await page.goto("/fi/about")
    await expect(page.locator("h1")).toHaveText("Tietoa")
  })

  test("/ returns 404 since detection is none", async ({ page }) => {
    const response = await page.goto("/")
    expect(response?.status()).toBe(404)
  })
})
