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

const { Locale } = await import("../../src/lib/locale")

// Helper to create a mock middleware context
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
      new Response(null, {
        status,
        headers: { location: url },
      }),
  }
}

function next() {
  return Promise.resolve(new Response("ok"))
}

async function run(pathname: string, cookieLocale?: string): Promise<Response> {
  const ctx = createContext(pathname, cookieLocale)
  const response = await Locale.middleware(ctx as any, next)
  return response as Response
}

describe("Locale.middleware", () => {
  it("passes through ignored paths", async () => {
    const response = await run("/_astro/chunk.js")
    expect(response.status).toBe(200)
  })

  it("passes through /keystatic", async () => {
    const response = await run("/keystatic/dashboard")
    expect(response.status).toBe(200)
  })

  it("passes through root /", async () => {
    const response = await run("/")
    expect(response.status).toBe(200)
  })

  it("passes through locale-prefixed paths", async () => {
    const response = await run("/en/about")
    expect(response.status).toBe(200)
  })

  it("sets locals.locale for locale-prefixed paths", async () => {
    const ctx = createContext("/fi/about")
    await Locale.middleware(ctx as any, next)
    expect(ctx.locals.locale).toBe("fi")
  })

  it("updates cookie when locale changes", async () => {
    const ctx = createContext("/fi/about", "en")
    await Locale.middleware(ctx as any, next)
    expect(ctx.cookies.get("locale")?.value).toBe("fi")
  })

  it("does not update cookie when locale is unchanged", async () => {
    const setCalled = vi.fn()
    const ctx = createContext("/fi/about", "fi")
    const originalSet = ctx.cookies.set
    ctx.cookies.set = (...args) => {
      setCalled()
      return originalSet(...args)
    }
    await Locale.middleware(ctx as any, next)
    expect(setCalled).not.toHaveBeenCalled()
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
