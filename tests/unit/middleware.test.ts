import { describe, expect, it, vi } from "vitest"

const resolvedConfig = {
  locales: [
    { code: "en", name: "English", endonym: "English" },
    { code: "fi", name: "Finnish", endonym: "Suomi" },
  ],
  defaultLocale: "en",
  ignore: ["/_astro", "/keystatic", "/api/uploads/**/*.png"],
  translations: undefined,
}

vi.mock("virtual:astro-i18n/config", () => ({
  config: resolvedConfig,
  translations: {},
}))

const { onRequest } = await import("../../src/middleware")

function createContext(pathname: string, cookieLocale?: string, isPrerendered = false) {
  const cookies = new Map<string, string>()
  if (cookieLocale) cookies.set("locale", cookieLocale)

  return {
    url: new URL(`https://example.com${pathname}`),
    isPrerendered,
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

async function run(
  pathname: string,
  cookieLocale?: string,
  isPrerendered = false
): Promise<Response> {
  const ctx = createContext(pathname, cookieLocale, isPrerendered)
  const response = await onRequest(ctx as any, next)
  return response as Response
}

describe("onRequest — prerendered passthrough", () => {
  it("passes through prerendered pages without touching them", async () => {
    expect((await run("/en/about", undefined, true)).status).toBe(200)
  })
})

describe("onRequest — plain prefix ignore patterns (auto-expanded)", () => {
  it("passes through /_astro exact path", async () => {
    expect((await run("/_astro")).status).toBe(200)
  })

  it("passes through /_astro sub-paths", async () => {
    expect((await run("/_astro/chunk.js")).status).toBe(200)
  })

  it("passes through /_astro deeply nested paths", async () => {
    expect((await run("/_astro/assets/image.webp")).status).toBe(200)
  })

  it("passes through /keystatic exact path", async () => {
    expect((await run("/keystatic")).status).toBe(200)
  })

  it("passes through /keystatic sub-paths", async () => {
    expect((await run("/keystatic/dashboard")).status).toBe(200)
  })

  it("passes through /keystatic deeply nested paths", async () => {
    expect((await run("/keystatic/collection/posts/create")).status).toBe(200)
  })
})

describe("onRequest — glob ignore patterns", () => {
  it("passes through paths matching a glob pattern", async () => {
    expect((await run("/api/uploads/photo.png")).status).toBe(200)
  })

  it("passes through nested paths matching a glob pattern", async () => {
    expect((await run("/api/uploads/nested/image.png")).status).toBe(200)
  })

  it("does not ignore paths that don't match the glob extension", async () => {
    const response = await run("/api/uploads/photo.jpg")
    expect(response.status).toBe(302)
  })

  it("does not ignore paths outside the glob prefix", async () => {
    const response = await run("/api/other/photo.png")
    expect(response.status).toBe(302)
  })
})

describe("onRequest — routing", () => {
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
