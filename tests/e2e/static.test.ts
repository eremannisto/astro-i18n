import { test, expect } from "@playwright/test"

test.describe("static mode — locale pages", () => {
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

test.describe("static mode — root detection", () => {
  test("redirects / to defaultLocale when no localStorage", async ({ page }) => {
    await page.goto("/en/")
    await page.evaluate(() => localStorage.clear())
    await page.goto("/")
    await expect(page).toHaveURL("/en/")
  })

  test("redirects / to stored localStorage locale", async ({ page }) => {
    await page.goto("/en/")
    await page.evaluate(() => localStorage.setItem("locale", "fi"))
    await page.goto("/")
    await expect(page).toHaveURL("/fi/")
  })

  test("redirects / to defaultLocale when localStorage has unknown locale", async ({ page }) => {
    await page.goto("/en/")
    await page.evaluate(() => localStorage.setItem("locale", "de"))
    await page.goto("/")
    await expect(page).toHaveURL("/en/")
  })
})
