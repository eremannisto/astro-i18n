export const Mock = {
  astro(pathname: string) {
    return { url: new URL(`https://example.com${pathname}`) }
  },

  translations: {
    en: {
      "nav.home": "Home",
      "nav.about": "About",
      "footer.copyright": "All rights reserved",
      "nav.contact": "Contact",
    },
    fi: {
      "nav.home": "Etusivu",
      "nav.about": "Tietoa",
      "footer.copyright": "Kaikki oikeudet pidätetään",
    },
  },
}
