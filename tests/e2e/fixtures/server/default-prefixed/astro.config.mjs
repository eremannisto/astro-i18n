import node from "@astrojs/node"
import i18n from "@mannisto/astro-i18n"
import { defineConfig } from "astro/config"

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [
    i18n({
      locales: [
        { code: "en", name: "English", endonym: "English" },
        { code: "fi", name: "Finnish", endonym: "Suomi", phrase: "Suomeksi" },
      ],
      defaultLocale: "en",
      translations: "./src/translations",
      ignore: ["/keystatic"],
    }),
  ],
})
