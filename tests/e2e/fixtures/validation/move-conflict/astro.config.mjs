import i18n from "@mannisto/astro-i18n"
import { defineConfig } from "astro/config"

// src/pages/about.astro and src/pages/[locale]/about.astro both build to /about
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
