// Type declaration for the virtual module that bakes config and translations
// into the bundle at build time. Populated by the Vite plugin in src/index.ts.
declare module "virtual:astro-i18n/config" {
  import type { ResolvedI18nConfig } from "./src/types"

  export const config: ResolvedI18nConfig
  export const translations: Record<string, Record<string, string>>
}

// Type declaration for the runtime subpath export.
// Pages and components import Locale from here, never from the root entry.
declare module "@mannisto/astro-i18n/runtime" {
  export { Locale } from "./dist/runtime"
}
