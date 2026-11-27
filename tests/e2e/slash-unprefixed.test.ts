import { expect, test } from "@playwright/test"

test.describe("trailingSlash never without a default locale prefix", () => {
  test("renders the home page of the default locale at the root", async ({ page }) => {
    const response = await page.goto("/")
    expect(response?.status()).toBe(200)
    await expect(page).toHaveURL("/")
    await expect(page.getByTestId("title")).toHaveText("Home")
  })

  test("renders the home page of another locale", async ({ page }) => {
    const response = await page.goto("/fi")
    expect(response?.status()).toBe(200)
    await expect(page.getByTestId("title")).toHaveText("Etusivu")
  })

  test("renders a page of the default locale", async ({ page }) => {
    const response = await page.goto("/about")
    expect(response?.status()).toBe(200)
    await expect(page.getByTestId("title")).toHaveText("About")
  })

  test("makes links without the slash at the end", async ({ page }) => {
    await page.goto("/fi")
    await expect(page.getByTestId("home")).toHaveAttribute("href", "/fi")
    await expect(page.getByTestId("about")).toHaveAttribute("href", "/fi/about")
  })
})
