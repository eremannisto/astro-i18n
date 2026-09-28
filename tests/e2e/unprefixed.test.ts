import { expect, test } from "@playwright/test"

test.describe("default locale pages", () => {
  test("renders the English home page at /", async ({ page }) => {
    const response = await page.goto("/")
    expect(response?.status()).toBe(200)
    await expect(page.getByTestId("title")).toHaveText("Home")
    await expect(page).toHaveURL("/")
  })

  test("renders the English about page at /about", async ({ page }) => {
    const response = await page.goto("/about")
    expect(response?.status()).toBe(200)
    await expect(page.getByTestId("title")).toHaveText("About")
    await expect(page.getByTestId("copyright")).toHaveText("All rights reserved")
    await expect(page).toHaveURL("/about")
  })
})

test.describe("other locale pages", () => {
  test("renders the Finnish home page at /fi/", async ({ page }) => {
    const response = await page.goto("/fi/")
    expect(response?.status()).toBe(200)
    await expect(page.getByTestId("title")).toHaveText("Etusivu")
  })

  test("renders the Finnish about page at /fi/about", async ({ page }) => {
    const response = await page.goto("/fi/about")
    expect(response?.status()).toBe(200)
    await expect(page.getByTestId("title")).toHaveText("Tietoa")
    await expect(page.getByTestId("copyright")).toHaveText("Kaikki oikeudet pidätetään")
  })
})

test.describe("root pages", () => {
  test("renders a page outside the [locale] folder", async ({ page }) => {
    const response = await page.goto("/privacy")
    expect(response?.status()).toBe(200)
    await expect(page.getByTestId("title")).toHaveText("Privacy")
  })
})

test.describe("404 handling", () => {
  for (const path of ["/en/", "/en/about", "/de/about", "/banana", "/fi/banana"]) {
    test(`renders the 404 page for ${path}`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(404)
      await expect(page.getByTestId("not-found")).toHaveText("404")
      await expect(page).toHaveURL(path)
    })
  }
})

test.describe("links", () => {
  test("links to English pages without a prefix", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByTestId("home")).toHaveAttribute("href", "/")
    await expect(page.getByTestId("about")).toHaveAttribute("href", "/about")
  })

  test("links to Finnish pages with a prefix", async ({ page }) => {
    await page.goto("/fi/")
    await expect(page.getByTestId("home")).toHaveAttribute("href", "/fi/")
    await expect(page.getByTestId("about")).toHaveAttribute("href", "/fi/about")
  })
})

test.describe("hreflang", () => {
  test("renders hreflang tags for all locales and x-default", async ({ page }) => {
    await page.goto("/")
    const link = (hreflang: string) => page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`)
    await expect(link("en")).toHaveAttribute("href", /\/$/)
    await expect(link("en")).not.toHaveAttribute("href", /\/en\/$/)
    await expect(link("fi")).toHaveAttribute("href", /\/fi\/$/)
    await expect(link("x-default")).not.toHaveAttribute("href", /\/en\/$/)
  })
})

test.describe("language switcher", () => {
  test("switches to another locale and back to the default locale", async ({ page }) => {
    await page.goto("/")
    await page.getByTestId("switch-fi").click()
    await expect(page).toHaveURL("/fi/")
    await page.getByTestId("switch-en").click()
    await expect(page).toHaveURL("/")
    await expect(page.getByTestId("title")).toHaveText("Home")
  })
})
