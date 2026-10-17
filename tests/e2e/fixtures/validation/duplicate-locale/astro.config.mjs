import i18n from "@mannisto/astro-i18n"
import { defineConfig } from "astro/config"

// two locales with the same code
export default defineConfig({
  integrations: [
    i18n({
      locales: [
        { code: "en", name: "English", endonym: "English" },
        { code: "en", name: "English (duplicate)", endonym: "English" },
        { code: "fi", name: "Finnish", endonym: "Suomi" },
      ],
    }),
  ],
})
