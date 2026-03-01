import { test, expect } from "@playwright/test"

test.describe("server mode — locale pages", () => {
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

test.describe("server mode — root detection", () => {
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
})

test.describe("server mode — unprefixed redirect", () => {
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
})

test.describe("server mode — 404 handling", () => {
  test("redirects unprefixed unknown path to defaultLocale", async ({ page }) => {
    await page.context().clearCookies()
    await page.goto("/banana")
    await expect(page).toHaveURL("/en/banana")
    await expect(page.getByTestId("not-found")).toHaveText("404")
  })

  test("redirects unprefixed unknown path to cookie locale", async ({ page }) => {
    await page
      .context()
      .addCookies([{ name: "locale", value: "fi", domain: "localhost", path: "/" }])
    await page.goto("/banana")
    await expect(page).toHaveURL("/fi/banana")
    await expect(page.getByTestId("not-found")).toHaveText("404")
  })

  test("renders 404 for unknown locale-prefixed path", async ({ page }) => {
    await page.context().clearCookies()
    await page.goto("/en/banana")
    await expect(page).toHaveURL("/en/banana")
    await expect(page.getByTestId("not-found")).toHaveText("404")
  })

  test("renders 404 for unknown fi-prefixed path", async ({ page }) => {
    await page.context().clearCookies()
    await page.goto("/fi/banana")
    await expect(page).toHaveURL("/fi/banana")
    await expect(page.getByTestId("not-found")).toHaveText("404")
  })
})
