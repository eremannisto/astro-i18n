import { describe, it, expect } from "vitest"
import { Validate } from "../../src/lib/validate"
import type { I18nConfig } from "../../src/types"

const baseConfig: I18nConfig = {
  locales: [
    { code: "en", name: "English", endonym: "English" },
    { code: "fi", name: "Finnish", endonym: "Suomi", phrase: "Suomeksi" },
  ],
  routing: {
    fallback: "en",
    detection: "server",
  },
}

describe("Validate.config", () => {
  it("passes with valid config", () => {
    expect(() => Validate.config(baseConfig)).not.toThrow()
  })

  it("throws if no locales defined", () => {
    expect(() => Validate.config({ ...baseConfig, locales: [] })).toThrow("No locales defined.")
  })

  it("throws if locale is missing a code", () => {
    expect(() =>
      Validate.config({
        ...baseConfig,
        locales: [{ code: "", name: "English", endonym: "English" }],
      })
    ).toThrow("missing a code")
  })

  it("throws if locale is missing a name", () => {
    expect(() =>
      Validate.config({
        ...baseConfig,
        locales: [{ code: "en", name: "", endonym: "English" }],
      })
    ).toThrow("missing a name")
  })

  it("throws if locale is missing an endonym", () => {
    expect(() =>
      Validate.config({
        ...baseConfig,
        locales: [{ code: "en", name: "English", endonym: "" }],
      })
    ).toThrow("missing an endonym")
  })

  it("throws if fallback locale is not in locales", () => {
    expect(() =>
      Validate.config({
        ...baseConfig,
        routing: { fallback: "de", detection: "server" },
      })
    ).toThrow('Fallback locale "de" not found in locales.')
  })

  it("throws if autoPrefix is set without detection: server", () => {
    expect(() =>
      Validate.config({
        ...baseConfig,
        routing: { detection: "client", autoPrefix: true },
      })
    ).toThrow("autoPrefix is only valid when detection is")
  })
})

describe("Validate.index", () => {
  it("passes if detection is none", () => {
    expect(() => Validate.index(new URL("file:///"), "none")).not.toThrow()
  })

  it("passes if no conflicting index.astro exists", () => {
    expect(() => Validate.index(new URL("file:///nonexistent/"), "server")).not.toThrow()
  })
})
