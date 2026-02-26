/// <reference types="astro/client" />
/// <reference path="./src/types.ts" />

declare module "virtual:astro-i18n/config" {
  import type { ResolvedI18nConfig } from "./src/types"
  export const config: ResolvedI18nConfig
  export const translations: Record<string, Record<string, string>>
}

declare namespace App {
  interface Locals {
    locale: string
  }
}
