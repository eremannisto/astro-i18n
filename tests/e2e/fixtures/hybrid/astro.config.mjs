import { defineConfig } from "astro/config"
import node from "@astrojs/node"
import i18n from "@mannisto/astro-i18n"

export default defineConfig({
  adapter: node({ mode: "standalone" }),
  integrations: [
    i18n({
      locales: [
        { code: "en", name: "English", endonym: "English" },
        { code: "fi", name: "Finnish", endonym: "Suomi", phrase: "Suomeksi" },
      ],
      mode: "hybrid",
      defaultLocale: "en",
      translations: "./src/translations",
      ignore: ["/keystatic"],
    }),
  ],
})
