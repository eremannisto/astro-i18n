export const Mock = {
  astro(pathname: string, cookieLocale?: string) {
    return {
      url: new URL(`https://example.com${pathname}`),
      cookies: {
        get: (name: string) =>
          name === "locale" && cookieLocale ? { value: cookieLocale } : undefined,
      },
      redirect: (path: string, status?: number) => ({ path, status }) as unknown as Response,
    }
  },

  translations: {
    en: {
      "nav.home": "Home",
      "nav.about": "About",
      "footer.copyright": "All rights reserved",
    },
    fi: {
      "nav.home": "Etusivu",
      "nav.about": "Tietoa",
      "footer.copyright": "Kaikki oikeudet pidätetään",
    },
  },
}
