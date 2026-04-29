import type { AstroConfig } from "astro"

export const Utils = {
  /**
   * No adapter configured — all pages are prerendered, root redirect is
   * handled client-side via an injected static HTML page.
   */
  isStatic(config: AstroConfig): boolean {
    return !config.adapter && config.output === "static"
  },

  /**
   * Adapter present with server output — all pages are SSR, all redirects
   * are handled server-side via middleware.
   */
  isServer(config: AstroConfig): boolean {
    return !!config.adapter && config.output === "server"
  },

  /**
   * Adapter present with static output — locale pages are prerendered,
   * root route is SSR, unprefixed paths are redirected via middleware.
   */
  isHybrid(config: AstroConfig): boolean {
    return !!config.adapter && config.output === "static"
  },

  /**
   * Checks if an adapter is configured.
   */
  hasAdapter(config: AstroConfig): boolean {
    return !!config.adapter
  },
}
