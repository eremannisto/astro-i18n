import { expect, test } from "@playwright/test"

test.describe("trailingSlash never with a default locale prefix", () => {
  test("redirects the root to the default locale", async ({ page }) => {
    await page.context().clearCookies()
    await page.goto("/")
    await expect(page).toHaveURL("/en")
    await expect(page.getByTestId("title")).toHaveText("Home")
  })

  test("redirects an unprefixed path to the default locale", async ({ page }) => {
    await page.context().clearCookies()
    await page.goto("/about")
    await expect(page).toHaveURL("/en/about")
    await expect(page.getByTestId("title")).toHaveText("About")
  })

  test("makes links without the slash at the end", async ({ page }) => {
    await page.goto("/en")
    await expect(page.getByTestId("home")).toHaveAttribute("href", "/en")
    await expect(page.getByTestId("about")).toHaveAttribute("href", "/en/about")
  })
})
