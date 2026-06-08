import i18n from "@mannisto/astro-i18n"
import { defineConfig } from "astro/config"

// fi.json exists but is missing a key present in en.json
export default defineConfig({
  integrations: [
    i18n({
      locales: [
        { code: "en", name: "English", endonym: "English" },
        { code: "fi", name: "Finnish", endonym: "Suomi" },
      ],
      translations: "./src/translations",
    }),
  ],
})
