import { describe, expect, it } from "vitest"

import { Config } from "../../src/lib/config"

describe("Config.validate — locales", () => {
  it("throws if no locales are defined", () => {
    expect(() => Config.validate({ locales: [] }, false)).toThrow("No locales defined.")
  })

  it("throws if a locale is missing a code", () => {
    expect(() =>
      Config.validate({ locales: [{ code: "", name: "English", endonym: "English" }] }, false)
    ).toThrow("A locale is missing a code.")
  })

  it("throws if a locale code contains invalid characters", () => {
    expect(() =>
      Config.validate({ locales: [{ code: "en US", name: "English", endonym: "English" }] }, false)
    ).toThrow('Locale code "en US" contains invalid characters.')
  })

  it("passes for locale codes with hyphens", () => {
    expect(() =>
      Config.validate({ locales: [{ code: "en-US", name: "English", endonym: "English" }] }, false)
    ).not.toThrow()
  })

  it("throws if a locale has an invalid direction", () => {
    expect(() =>
      Config.validate(
        {
          locales: [{ code: "en", name: "English", endonym: "English", direction: "btt" as never }],
        },
        false
      )
    ).toThrow('Locale "en" has an invalid direction "btt". Must be "ltr" or "rtl".')
  })

  it("passes with direction ltr", () => {
    expect(() =>
      Config.validate(
        { locales: [{ code: "en", name: "English", endonym: "English", direction: "ltr" }] },
        false
      )
    ).not.toThrow()
  })

  it("passes with direction rtl", () => {
    expect(() =>
      Config.validate(
        { locales: [{ code: "ar", name: "Arabic", endonym: "العربية", direction: "rtl" }] },
        false
      )
    ).not.toThrow()
  })

  it("throws if locale codes are duplicated", () => {
    expect(() =>
      Config.validate(
        {
          locales: [
            { code: "en", name: "English", endonym: "English" },
            { code: "en", name: "English (duplicate)", endonym: "English" },
          ],
        },
        false
      )
    ).toThrow("Duplicate locale codes: en.")
  })
})

describe("Config.validate — defaultLocale", () => {
  it("throws if defaultLocale is not in locales", () => {
    expect(() =>
      Config.validate(
        { locales: [{ code: "en", name: "English", endonym: "English" }], defaultLocale: "fi" },
        false
      )
    ).toThrow('defaultLocale "fi" not found in locales.')
  })

  it("passes if defaultLocale is in locales", () => {
    expect(() =>
      Config.validate(
        { locales: [{ code: "en", name: "English", endonym: "English" }], defaultLocale: "en" },
        false
      )
    ).not.toThrow()
  })

  it("passes if defaultLocale is omitted", () => {
    expect(() =>
      Config.validate({ locales: [{ code: "en", name: "English", endonym: "English" }] }, false)
    ).not.toThrow()
  })
})

describe("Config.validate — ignore", () => {
  it("throws if ignore is used without an adapter", () => {
    expect(() =>
      Config.validate(
        { locales: [{ code: "en", name: "English", endonym: "English" }], ignore: ["/keystatic"] },
        false
      )
    ).toThrow('"ignore" requires a server adapter.')
  })

  it("passes if ignore is used with an adapter", () => {
    expect(() =>
      Config.validate(
        { locales: [{ code: "en", name: "English", endonym: "English" }], ignore: ["/keystatic"] },
        true
      )
    ).not.toThrow()
  })

  it("passes without ignore", () => {
    expect(() =>
      Config.validate({ locales: [{ code: "en", name: "English", endonym: "English" }] }, false)
    ).not.toThrow()
  })
})

describe("Config.validate — full config", () => {
  it("passes for a valid server config", () => {
    expect(() =>
      Config.validate(
        {
          locales: [
            { code: "en", name: "English", endonym: "English" },
            { code: "fi", name: "Finnish", endonym: "Suomi" },
          ],
          defaultLocale: "en",
          ignore: ["/keystatic"],
        },
        true
      )
    ).not.toThrow()
  })

  it("passes without optional fields", () => {
    expect(() =>
      Config.validate({ locales: [{ code: "en", name: "English", endonym: "English" }] }, false)
    ).not.toThrow()
  })
})
