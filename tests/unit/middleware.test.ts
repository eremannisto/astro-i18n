import { describe, it, expect, vi } from "vitest"

const resolvedConfig = {
  locales: [
    { code: "en", name: "English", endonym: "English" },
    { code: "fi", name: "Finnish", endonym: "Suomi" },
  ],
  mode: "server",
  defaultLocale: "en",
  ignore: ["/_astro", "/keystatic"],
  translations: undefined,
}

vi.mock("virtual:astro-i18n/config", () => ({
  config: resolvedConfig,
  translations: {},
}))

const { onRequest } = await import("../../src/middleware")

function createContext(pathname: string, cookieLocale?: string) {
  const cookies = new Map<string, string>()
  if (cookieLocale) cookies.set("locale", cookieLocale)

  return {
    url: new URL(`https://example.com${pathname}`),
    cookies: {
      get: (key: string) => (cookies.has(key) ? { value: cookies.get(key)! } : undefined),
      set: (key: string, value: string) => cookies.set(key, value),
    },
    locals: {} as Record<string, string>,
    redirect: (url: string, status: number) =>
      new Response(null, { status, headers: { location: url } }),
  }
}

function next() {
  return Promise.resolve(new Response("ok"))
}

async function run(pathname: string, cookieLocale?: string): Promise<Response> {
  const ctx = createContext(pathname, cookieLocale)
  const response = await onRequest(ctx as any, next)
  return response as Response
}

describe("onRequest (i18n middleware)", () => {
  it("passes through ignored /_astro paths", async () => {
    expect((await run("/_astro/chunk.js")).status).toBe(200)
  })

  it("passes through /keystatic", async () => {
    expect((await run("/keystatic/dashboard")).status).toBe(200)
  })

  it("passes through root /", async () => {
    expect((await run("/")).status).toBe(200)
  })

  it("passes through locale-prefixed paths", async () => {
    expect((await run("/en/about")).status).toBe(200)
    expect((await run("/fi/about")).status).toBe(200)
  })

  it("redirects unprefixed path to defaultLocale when no cookie", async () => {
    const response = await run("/about")
    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe("/en/about")
  })

  it("redirects unprefixed path to cookie locale", async () => {
    const response = await run("/about", "fi")
    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe("/fi/about")
  })

  it("redirects to defaultLocale when cookie has unknown locale", async () => {
    const response = await run("/about", "de")
    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe("/en/about")
  })
})
