import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    runtime: "src/lib/locale.ts",
    middleware: "src/middleware.ts",
    "detect/server": "src/detect/server.ts",
    "detect/static": "src/detect/static.ts",
    "detect/hybrid": "src/detect/hybrid.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  external: ["astro", "astro/middleware", "vite", "virtual:astro-i18n/config", "picomatch"],
})
