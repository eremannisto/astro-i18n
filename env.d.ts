/// <reference types="astro/client" />
/// <reference path="./src/types.ts" />

declare module "virtual:astro-i18n/config" {
  import type { ResolvedI18nConfig } from "./src/types"
  export const config: ResolvedI18nConfig
  export const translations: Record<string, Record<string, string>>
}

// For tsc only: the Astro language tools read the real component types
declare module "*.astro" {
  export type Props = Record<string, unknown>
  const Component: (props: Props) => unknown
  export default Component
}

declare namespace App {
  interface Locals {
    i18nRewrite?: boolean
  }
}
