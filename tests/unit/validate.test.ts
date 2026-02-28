import { describe, it, expect } from "vitest"
import { Validate } from "../../src/lib/validate"

describe("Validate.config", () => {
  it("throws if no locales are defined", () => {
    expect(() => Validate.config({ locales: [] })).toThrow("No locales defined.")
  })

  it("throws if a locale is missing a code", () => {
    expect(() =>
      Validate.config({
        locales: [{ code: "", name: "English", endonym: "English" }],
      })
    ).toThrow("A locale is missing a code.")
  })

  it("throws if a locale is missing a name", () => {
    expect(() =>
      Validate.config({
        locales: [{ code: "en", name: "", endonym: "English" }],
      })
    ).toThrow('Locale "en" is missing a name.')
  })

  it("throws if a locale is missing an endonym", () => {
    expect(() =>
      Validate.config({
        locales: [{ code: "en", name: "English", endonym: "" }],
      })
    ).toThrow('Locale "en" is missing an endonym.')
  })

  it("throws if defaultLocale is not in locales", () => {
    expect(() =>
      Validate.config({
        locales: [{ code: "en", name: "English", endonym: "English" }],
        defaultLocale: "fi",
      })
    ).toThrow('defaultLocale "fi" not found in locales.')
  })

  it("throws if mode is invalid", () => {
    expect(() =>
      Validate.config({
        locales: [{ code: "en", name: "English", endonym: "English" }],
        mode: "client" as never,
      })
    ).toThrow('Invalid mode "client". Must be one of: static, server, hybrid.')
  })

  it("throws if ignore is used with static mode", () => {
    expect(() =>
      Validate.config({
        locales: [{ code: "en", name: "English", endonym: "English" }],
        mode: "static",
        ignore: ["/keystatic"],
      })
    ).toThrow('"ignore" is only valid when mode is "server" or "hybrid".')
  })

  it("passes for a valid server config with ignore", () => {
    expect(() =>
      Validate.config({
        locales: [
          { code: "en", name: "English", endonym: "English" },
          { code: "fi", name: "Finnish", endonym: "Suomi" },
        ],
        mode: "server",
        defaultLocale: "en",
        ignore: ["/keystatic"],
      })
    ).not.toThrow()
  })

  it("passes for a valid hybrid config with ignore", () => {
    expect(() =>
      Validate.config({
        locales: [{ code: "en", name: "English", endonym: "English" }],
        mode: "hybrid",
        ignore: ["/keystatic"],
      })
    ).not.toThrow()
  })

  it("passes without optional fields", () => {
    expect(() =>
      Validate.config({
        locales: [{ code: "en", name: "English", endonym: "English" }],
      })
    ).not.toThrow()
  })
})

describe("Validate.index", () => {
  it("does nothing if mode is undefined", () => {
    expect(() => Validate.index(new URL("file:///fake/"), undefined)).not.toThrow()
  })
})
