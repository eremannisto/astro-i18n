import i18n from "@mannisto/astro-i18n"
import { defineConfig } from "astro/config"

// locale code contains a space, which is invalid
export default defineConfig({
  integrations: [
    i18n({
      locales: [
        { code: "en", name: "English", endonym: "English" },
        { code: "zh CN", name: "Chinese", endonym: "中文" },
      ],
    }),
  ],
})
