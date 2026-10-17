import { expect, test } from "@playwright/test"

test.describe("locale pages", () => {
  test("renders the English home page at /en/", async ({ page }) => {
    await page.goto("/en/")
    await expect(page.getByTestId("title")).toHaveText("Home")
    await expect(page).toHaveURL("/en/")
  })

  test("renders the Finnish home page at /fi/", async ({ page }) => {
    await page.goto("/fi/")
    await expect(page.getByTestId("title")).toHaveText("Etusivu")
    await expect(page).toHaveURL("/fi/")
  })

  test("renders the English about page at /en/about", async ({ page }) => {
    await page.goto("/en/about")
    await expect(page.getByTestId("title")).toHaveText("About")
    await expect(page.getByTestId("copyright")).toHaveText("All rights reserved")
  })

  test("renders the Finnish about page at /fi/about", async ({ page }) => {
    await page.goto("/fi/about")
    await expect(page.getByTestId("title")).toHaveText("Tietoa")
    await expect(page.getByTestId("copyright")).toHaveText("Kaikki oikeudet pidätetään")
  })
})

test.describe("root pages", () => {
  test("renders a page outside the [locale] folder", async ({ page }) => {
    await page.goto("/privacy")
    await expect(page.getByTestId("title")).toHaveText("Privacy")
    await expect(page).toHaveURL("/privacy")
  })
})

test.describe("root detection", () => {
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

  test("persists locale preference on return visit to /", async ({ page }) => {
    await page.context().clearCookies()
    await page.goto("/fi/")
    await page.goto("/")
    await expect(page).toHaveURL("/fi/")
  })
})

test.describe("unprefixed redirect", () => {
  test("redirects unprefixed path to defaultLocale when no cookie", async ({ page }) => {
    await page.context().clearCookies()
    await page.goto("/about")
    await expect(page).toHaveURL("/en/about")
    await expect(page.getByTestId("title")).toHaveText("About")
  })

  test("redirects unprefixed path to cookie locale", async ({ page }) => {
    await page
      .context()
      .addCookies([{ name: "locale", value: "fi", domain: "localhost", path: "/" }])
    await page.goto("/about")
    await expect(page).toHaveURL("/fi/about")
    await expect(page.getByTestId("title")).toHaveText("Tietoa")
  })
})

test.describe("404 handling", () => {
  test("redirects unprefixed unknown path to defaultLocale", async ({ page }) => {
    await page.context().clearCookies()
    await page.goto("/banana")
    await expect(page).toHaveURL("/en/banana")
    await expect(page.getByTestId("not-found")).toHaveText("404")
  })

  test("renders 404 for unknown en-prefixed path", async ({ page }) => {
    const response = await page.goto("/en/banana")
    expect(response?.status()).toBe(404)
    await expect(page.getByTestId("not-found")).toHaveText("404")
  })

  test("renders 404 for unknown fi-prefixed path", async ({ page }) => {
    const response = await page.goto("/fi/banana")
    expect(response?.status()).toBe(404)
    await expect(page.getByTestId("not-found")).toHaveText("404")
  })
})

test.describe("links", () => {
  test("links to English pages with a prefix", async ({ page }) => {
    await page.goto("/en/")
    await expect(page.getByTestId("home")).toHaveAttribute("href", "/en/")
    await expect(page.getByTestId("about")).toHaveAttribute("href", "/en/about")
  })
})

test.describe("hreflang", () => {
  test("renders hreflang tags for all locales and x-default", async ({ page }) => {
    await page.goto("/fi/")
    const link = (hreflang: string) => page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`)
    await expect(link("en")).toHaveAttribute("href", /\/en\/$/)
    await expect(link("fi")).toHaveAttribute("href", /\/fi\/$/)
    await expect(link("x-default")).toHaveAttribute("href", /\/en\/$/)
  })
})

test.describe("language switcher", () => {
  test("switches the locale and stores it for the next visit to /", async ({ page }) => {
    await page.context().clearCookies()
    await page.goto("/en/")
    await page.getByTestId("switch-fi").click()
    await expect(page).toHaveURL("/fi/")
    await page.goto("/")
    await expect(page).toHaveURL("/fi/")
  })
})
