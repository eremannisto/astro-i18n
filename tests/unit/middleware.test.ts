import { afterEach, describe, expect, it, vi } from "vitest"

type Options = {
  routePattern?: string
  cookie?: string
  isPrerendered?: boolean
  rewritten?: boolean
  rewrite?: (path: string) => Promise<Response>
}

async function load(prefixDefaultLocale: boolean, base = "") {
  vi.resetModules()
  vi.doMock("virtual:astro-i18n/config", () => ({
    config: {
      locales: [
        { code: "en", name: "English", endonym: "English" },
        { code: "fi", name: "Finnish", endonym: "Suomi" },
      ],
      defaultLocale: "en",
      prefixDefaultLocale,
      base,
      translations: undefined,
    },
    translations: {},
  }))
  const { onRequest } = await import("../../src/middleware")

  return async (pathname: string, options: Options = {}) => {
    const context = {
      url: new URL(`https://example.com${pathname}`),
      routePattern: options.routePattern ?? "/[locale]",
      isPrerendered: options.isPrerendered ?? false,
      locals: { i18nRewrite: options.rewritten },
      cookies: {
        get: (key: string) =>
          key === "locale" && options.cookie ? { value: options.cookie } : undefined,
      },
      redirect: (url: string, status: number) =>
        new Response(null, { status, headers: { location: url } }),
      rewrite: options.rewrite ?? ((path: string) => Promise.resolve(new Response(path))),
    }
    const next = () => Promise.resolve(new Response("next"))
    const response = (await onRequest(context as any, next)) as Response
    return { response, body: await response.text() }
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("both modes", () => {
  it("passes through prerendered pages in production", async () => {
    vi.stubEnv("DEV", false)
    const run = await load(false)
    expect((await run("/about", { isPrerendered: true })).body).toBe("next")
  })

  it("passes through pages outside the [locale] folder", async () => {
    const run = await load(false)
    expect((await run("/privacy", { routePattern: "/privacy" })).body).toBe("next")
  })

  it("renders the 404 page for a locale path that only the fallback route matches", async () => {
    for (const prefixDefaultLocale of [true, false]) {
      const run = await load(prefixDefaultLocale)
      const { response, body } = await run("/fi/banana", { routePattern: "/[...i18nFallback]" })
      expect(response.status).toBe(404)
      expect(body).toBe("/404")
    }
  })
})

describe("prefixDefaultLocale: true", () => {
  it("passes through locale-prefixed paths", async () => {
    const run = await load(true)
    expect((await run("/en/about")).body).toBe("next")
    expect((await run("/fi/about")).body).toBe("next")
  })

  it("redirects an unprefixed path to defaultLocale when no cookie", async () => {
    const run = await load(true)
    const { response } = await run("/about")
    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe("/en/about")
  })

  it("redirects an unprefixed path to the cookie locale", async () => {
    const run = await load(true)
    const { response } = await run("/about", { cookie: "fi" })
    expect(response.headers.get("location")).toBe("/fi/about")
  })

  it("redirects to defaultLocale when the cookie has an unknown locale", async () => {
    const run = await load(true)
    const { response } = await run("/about", { cookie: "de" })
    expect(response.headers.get("location")).toBe("/en/about")
  })
})

describe("prefixDefaultLocale: false", () => {
  it("rewrites an unprefixed path to the default locale", async () => {
    const run = await load(false)
    const { response, body } = await run("/about")
    expect(response.status).toBe(200)
    expect(body).toBe("/en/about")
  })

  it("rewrites / to the default locale home page", async () => {
    const run = await load(false)
    expect((await run("/")).body).toBe("/en/")
  })

  it("passes through paths of the other locales", async () => {
    const run = await load(false)
    expect((await run("/fi/about")).body).toBe("next")
  })

  it("renders the 404 page for default locale paths with a prefix", async () => {
    const run = await load(false)
    const { response, body } = await run("/en/about")
    expect(response.status).toBe(404)
    expect(body).toBe("/404")
  })

  it("renders the 404 page when the rewritten page does not exist", async () => {
    const run = await load(false)
    const rewrite = (path: string) =>
      Promise.resolve(new Response(path, { status: path === "/404" ? 200 : 404 }))
    const { response, body } = await run("/banana", { rewrite })
    expect(response.status).toBe(404)
    expect(body).toBe("/404")
  })

  it("renders the 404 page when the rewrite throws", async () => {
    const run = await load(false)
    const rewrite = (path: string) =>
      path === "/404" ? Promise.resolve(new Response(path)) : Promise.reject(new Error())
    const { response, body } = await run("/banana", { rewrite })
    expect(response.status).toBe(404)
    expect(body).toBe("/404")
  })

  it("returns an empty 404 when the 404 page cannot be a rewrite target", async () => {
    const run = await load(false)
    const { response, body } = await run("/en/about", {
      rewrite: () => Promise.reject(new Error()),
    })
    expect(response.status).toBe(404)
    expect(body).toBe("")
  })

  it("passes through the second pass after its own rewrite", async () => {
    const run = await load(false)
    expect((await run("/en/about", { rewritten: true })).body).toBe("next")
  })
})

describe("base", () => {
  it("redirects with the base", async () => {
    const run = await load(true, "/docs")
    const { response } = await run("/docs/about")
    expect(response.headers.get("location")).toBe("/docs/en/about")
  })

  it("passes through locale paths after the base", async () => {
    const run = await load(true, "/docs")
    expect((await run("/docs/fi/about")).body).toBe("next")
  })

  it("rewrites with the base", async () => {
    const run = await load(false, "/docs")
    expect((await run("/docs/about")).body).toBe("/docs/en/about")
  })

  it("renders the 404 page with the base", async () => {
    const run = await load(false, "/docs")
    const { response, body } = await run("/docs/en/about")
    expect(response.status).toBe(404)
    expect(body).toBe("/docs/404")
  })
})
