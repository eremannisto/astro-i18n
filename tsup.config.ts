import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    runtime: "src/lib/locale.ts",
    middleware: "src/middleware.ts",
    "detect/server": "src/detect/server.ts",
    "detect/client": "src/detect/client.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  external: ["astro", "vite", "virtual:astro-i18n/config"],
})
