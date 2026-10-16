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

  /**
   * Adds or removes the slash at the end of a path, the same as the Astro trailingSlash
   * option. With "ignore", the path stays unchanged. The root and a file, e.g. /rss.xml,
   * also stay unchanged.
   */
  slash(path: string): string {
    const { trailingSlash } = config
    if (trailingSlash !== "always" && trailingSlash !== "never") return path
    if (path === "/" || path.split("/").pop()?.includes(".")) return path

    if (trailingSlash === "always") {
      return path.endsWith("/") ? path : `${path}/`
    }
    return path.replace(/\/+$/, "") || "/"
  },
}
