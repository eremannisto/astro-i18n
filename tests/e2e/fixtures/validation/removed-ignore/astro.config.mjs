import i18n from "@mannisto/astro-i18n"
import { defineConfig } from "astro/config"

// "ignore" was removed in v3 and must show a migration warning
export default defineConfig({
  integrations: [
    i18n({
      locales: [
        { code: "en", name: "English", endonym: "English" },
        { code: "fi", name: "Finnish", endonym: "Suomi" },
      ],
      ignore: ["/api"],
    }),
  ],
})
