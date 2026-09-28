import { config } from "virtual:astro-i18n/config"

export const Paths = {
  /**
   * Removes the Astro base from a pathname: /docs/fi/about becomes /fi/about.
   */
  strip(pathname: string): string {
    const { base } = config
    if (!base) return pathname
    if (pathname === base) return "/"
    if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length)
    return pathname
  },

  /**
   * Adds the Astro base to a path: /fi/about becomes /docs/fi/about.
   */
  add(path: string): string {
    return `${config.base}${path}`
  },
}
