import i18n from "@mannisto/astro-i18n"
import { defineConfig } from "astro/config"

// src/pages/index.astro has the same URL as the default locale home page
export default defineConfig({
  integrations: [
    i18n({
      locales: [
        { code: "en", name: "English", endonym: "English" },
        { code: "fi", name: "Finnish", endonym: "Suomi" },
      ],
      prefixDefaultLocale: false,
    }),
  ],
})
