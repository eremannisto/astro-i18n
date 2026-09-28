// src/lib/paths.ts
import { config } from "virtual:astro-i18n/config";
var Paths = {
  /**
   * Removes the Astro base from a pathname: /docs/fi/about becomes /fi/about.
   */
  strip(pathname) {
    const { base } = config;
    if (!base) return pathname;
    if (pathname === base) return "/";
    if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length);
    return pathname;
  },
  /**
   * Adds the Astro base to a path: /fi/about becomes /docs/fi/about.
   */
  add(path) {
    return `${config.base}${path}`;
  }
};

export {
  Paths
};
