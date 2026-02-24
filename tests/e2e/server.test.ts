import { test, expect } from "@playwright/test"

// fresh browser context per test to prevent cookie bleed between tests
test.use({ storageState: { cookies: [], origins: [] } })

test.describe("server detection", () => {
  test("first visit / with Accept-Language: fi redirects to /fi/", async ({ browser }) => {
    const context = await browser.newContext({
      locale: "fi",
      extraHTTPHeaders: { "accept-language": "fi" },
    })
    const page = await context.newPage()
    await page.goto("http://localhost:4321/")
    await expect(page).toHaveURL("http://localhost:4321/fi/")
    await context.close()
  })

  test("first visit / with Accept-Language: en redirects to /en/", async ({ page }) => {
    await page.setExtraHTTPHeaders({ "accept-language": "en" })
    await page.goto("/")
    await expect(page).toHaveURL("/en/")
  })

  test("first visit / with unknown Accept-Language redirects to fallback /en/", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      locale: "de",
      extraHTTPHeaders: { "accept-language": "de" },
    })
    const page = await context.newPage()
    await page.goto("http://localhost:4321/")
    await expect(page).toHaveURL("http://localhost:4321/en/")
    await context.close()
  })

  test("return visit / with cookie locale=fi redirects to /fi/", async ({ page, context }) => {
    await context.addCookies([{ name: "locale", value: "fi", url: "http://localhost:4321" }])
    await page.goto("/")
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

  test("/en/about serves correct page", async ({ page }) => {
    await page.goto("/en/about")
    await expect(page.locator("h1")).toHaveText("About")
  })

  test("/fi/about serves correct page", async ({ page }) => {
    await page.goto("/fi/about")
    await expect(page.locator("h1")).toHaveText("Tietoa")
  })

  test("/de/ redirects to /en/de/ with no cookie", async ({ page }) => {
    await page.goto("/de/")
    await expect(page).toHaveURL("/en/de/")
  })

  test("/de/ redirects to /fi/de/ with cookie locale=fi", async ({ page, context }) => {
    await context.addCookies([{ name: "locale", value: "fi", url: "http://localhost:4321" }])
    await page.goto("/de/")
    await expect(page).toHaveURL("/fi/de/")
  })

  test("/keystatic passes through without redirect", async ({ page }) => {
    await page.goto("/keystatic")
    expect(page.url()).not.toContain("/en/keystatic")
    expect(page.url()).not.toContain("/fi/keystatic")
  })
})
