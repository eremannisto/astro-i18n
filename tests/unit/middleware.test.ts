import { describe, it, expect, vi } from "vitest"

const resolvedConfig = {
  locales: [
    { code: "en", name: "English", endonym: "English" },
    { code: "fi", name: "Finnish", endonym: "Suomi", phrase: "Suomeksi" },
  ],
  routing: {
    fallback: "en",
    detection: "server",
    autoPrefix: { ignore: ["/_astro", "/keystatic"] },
  },
  translations: "./src/translations",
}

const translationData = {
  en: { "nav.home": "Home" },
  fi: { "nav.home": "Etusivu" },
}

vi.mock("virtual:astro-i18n/config", () => ({
  config: resolvedConfig,
  translations: translationData,
}))

const { Locale } = await import("../../src/lib/locale")

function createContext(pathname: string, localeCookie?: string) {
  return {
    url: new URL(`http://localhost:4321${pathname}`),
    cookies: {
      get: (name: string) =>
        name === "locale" && localeCookie ? { value: localeCookie } : undefined,
    },
    redirect: (url: string) => new Response(null, { status: 302, headers: { location: url } }),
  }
}

describe("Locale.middleware", () => {
  it("passes through ignored path /_astro", async () => {
    const ctx = createContext("/_astro/style.css")
    let nextCalled = false
    await Locale.middleware(ctx as any, async () => {
      nextCalled = true
      return new Response()
    })
    expect(nextCalled).toBe(true)
  })

  it("passes through ignored path /keystatic", async () => {
    const ctx = createContext("/keystatic")
    let nextCalled = false
    await Locale.middleware(ctx as any, async () => {
      nextCalled = true
      return new Response()
    })
    expect(nextCalled).toBe(true)
  })

  it("passes through root /", async () => {
    const ctx = createContext("/")
    let nextCalled = false
    await Locale.middleware(ctx as any, async () => {
      nextCalled = true
      return new Response()
    })
    expect(nextCalled).toBe(true)
  })

  it("passes through known locale prefix /en/", async () => {
    const ctx = createContext("/en/")
    let nextCalled = false
    await Locale.middleware(ctx as any, async () => {
      nextCalled = true
      return new Response()
    })
    expect(nextCalled).toBe(true)
  })

  it("passes through known locale prefix /fi/about", async () => {
    const ctx = createContext("/fi/about")
    let nextCalled = false
    await Locale.middleware(ctx as any, async () => {
      nextCalled = true
      return new Response()
    })
    expect(nextCalled).toBe(true)
  })

  it("redirects to fallback when no cookie is set", async () => {
    const ctx = createContext("/de/")
    const response = await Locale.middleware(ctx as any, async () => new Response())
    expect(response).toBeInstanceOf(Response)
    expect((response as Response).headers.get("location")).toBe("/en/de/")
  })

  it("redirects to cookie locale when cookie is set", async () => {
    const ctx = createContext("/de/", "fi")
    const response = await Locale.middleware(ctx as any, async () => new Response())
    expect(response).toBeInstanceOf(Response)
    expect((response as Response).headers.get("location")).toBe("/fi/de/")
  })
})
