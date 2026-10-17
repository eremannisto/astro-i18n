import { expect, test } from "@playwright/test"

test.describe("base with a default locale prefix", () => {
  test("redirects the base to the default locale", async ({ page }) => {
    await page.context().clearCookies()
    await page.goto("/docs/")
    await expect(page).toHaveURL("/docs/en/")
    await expect(page.getByTestId("title")).toHaveText("Home")
  })

  test("redirects an unprefixed path to the default locale", async ({ page }) => {
    await page.context().clearCookies()
    await page.goto("/docs/about")
    await expect(page).toHaveURL("/docs/en/about")
    await expect(page.getByTestId("title")).toHaveText("About")
  })

  test("redirects an unprefixed path to the cookie locale", async ({ page }) => {
    await page
      .context()
      .addCookies([{ name: "locale", value: "fi", domain: "localhost", path: "/" }])
    await page.goto("/docs/about")
    await expect(page).toHaveURL("/docs/fi/about")
    await expect(page.getByTestId("title")).toHaveText("Tietoa")
  })

  test("renders a page outside the [locale] folder", async ({ page }) => {
    await page.goto("/docs/privacy")
    await expect(page.getByTestId("title")).toHaveText("Privacy")
  })

  test("renders the 404 page for an unknown locale path", async ({ page }) => {
    const response = await page.goto("/docs/fi/banana")
    expect(response?.status()).toBe(404)
    await expect(page.getByTestId("not-found")).toHaveText("404")
  })

  test("adds the base to links and hreflang tags", async ({ page }) => {
    await page.goto("/docs/fi/")
    await expect(page.getByTestId("about")).toHaveAttribute("href", "/docs/fi/about")
    const link = (hreflang: string) => page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`)
    await expect(link("en")).toHaveAttribute("href", /\/docs\/en\/$/)
  })
})

test.describe("language switcher with base", () => {
  test("switches the locale", async ({ page }) => {
    await page.context().clearCookies()
    await page.goto("/docs/en/")
    await page.getByTestId("switch-fi").click()
    await expect(page).toHaveURL("/docs/fi/")
  })
})
