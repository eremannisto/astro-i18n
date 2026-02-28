import { test, expect } from "@playwright/test"

test.describe("hybrid mode — locale pages", () => {
  test("renders English home page", async ({ page }) => {
    await page.goto("/en/")
    await expect(page.getByTestId("title")).toHaveText("Home")
    await expect(page).toHaveURL("/en/")
  })

  test("renders Finnish home page", async ({ page }) => {
    await page.goto("/fi/")
    await expect(page.getByTestId("title")).toHaveText("Etusivu")
    await expect(page).toHaveURL("/fi/")
  })

  test("renders English about page", async ({ page }) => {
    await page.goto("/en/about")
    await expect(page.getByTestId("title")).toHaveText("About")
    await expect(page.getByTestId("copyright")).toHaveText("All rights reserved")
  })

  test("renders Finnish about page", async ({ page }) => {
    await page.goto("/fi/about")
    await expect(page.getByTestId("title")).toHaveText("Tietoa")
    await expect(page.getByTestId("copyright")).toHaveText("Kaikki oikeudet pidätetään")
  })
})

test.describe("hybrid mode — root detection", () => {
  test("redirects / to defaultLocale when no cookie", async ({ page }) => {
    await page.context().clearCookies()
    await page.goto("/")
    await expect(page).toHaveURL("/en/")
  })

  test("redirects / to stored cookie locale", async ({ page }) => {
    await page
      .context()
      .addCookies([{ name: "locale", value: "fi", domain: "localhost", path: "/" }])
    await page.goto("/")
    await expect(page).toHaveURL("/fi/")
  })

  test("redirects / to defaultLocale when cookie has unknown locale", async ({ page }) => {
    await page
      .context()
      .addCookies([{ name: "locale", value: "de", domain: "localhost", path: "/" }])
    await page.goto("/")
    await expect(page).toHaveURL("/en/")
  })

  test("updates cookie via Locale.switch and persists on return visit to /", async ({ page }) => {
    await page.context().clearCookies()
    // First visit — defaults to en
    await page.goto("/")
    await expect(page).toHaveURL("/en/")
    // Simulate Locale.switch("fi") updating the cookie client-side
    await page.evaluate(() => {
      document.cookie = "locale=fi; path=/; max-age=31536000; SameSite=Lax; Secure"
    })
    // Return to / — should redirect to fi
    await page.goto("/")
    await expect(page).toHaveURL("/fi/")
  })
})

test.describe("hybrid mode — unprefixed redirect", () => {
  test("redirects unprefixed path to defaultLocale when no cookie", async ({ page }) => {
    await page.context().clearCookies()
    await page.goto("/about")
    await expect(page).toHaveURL("/en/about")
  })

  test("redirects unprefixed path to cookie locale", async ({ page }) => {
    await page
      .context()
      .addCookies([{ name: "locale", value: "fi", domain: "localhost", path: "/" }])
    await page.goto("/about")
    await expect(page).toHaveURL("/fi/about")
  })

  test("redirects to defaultLocale when cookie has unknown locale", async ({ page }) => {
    await page
      .context()
      .addCookies([{ name: "locale", value: "de", domain: "localhost", path: "/" }])
    await page.goto("/about")
    await expect(page).toHaveURL("/en/about")
  })

  test("does not redirect ignored paths", async ({ page }) => {
    await page.context().clearCookies()
    const response = await page.request.get("/keystatic")
    expect(response.status()).not.toBe(302)
  })
})
