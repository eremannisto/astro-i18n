import { defineConfig } from "astro/config"
import i18n from "@mannisto/astro-i18n"

// this config intentionally declares a translations path that does not exist
export default defineConfig({
  integrations: [
    i18n({
      locales: [
        { code: "en", name: "English", endonym: "English" },
        { code: "fi", name: "Finnish", endonym: "Suomi" },
      ],
      routing: {
        fallback: "en",
        detection: "none",
      },
      translations: "./src/translations",
    }),
  ],
})
