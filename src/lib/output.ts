import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { NAME } from "../constants"
import type { LocaleConfig, ResolvedI18nConfig } from "../types"

export const Output = {
  /**
   * Moves the prerendered pages of the default locale to the root of the output,
   * e.g. en/about/index.html to about/index.html. Throws if a target file exists.
   */
  moveDefaultLocale(dir: URL, locale: string): void {
    const root = fileURLToPath(dir)
    const source = path.join(root, locale)
    const moves: [string, string][] = []

    if (fs.existsSync(source)) {
      const files = fs.readdirSync(source, { recursive: true, encoding: "utf8" })
      for (const file of files) {
        const from = path.join(source, file)
        if (fs.statSync(from).isFile()) moves.push([from, path.join(root, file)])
      }
    }

    // build.format "file" writes the locale index page as en.html
    const page = path.join(root, `${locale}.html`)
    if (fs.existsSync(page)) moves.push([page, path.join(root, "index.html")])

    for (const [from, to] of moves) {
      if (fs.existsSync(to)) {
        throw new Error(
          `${NAME} Cannot move ${path.relative(root, from)} to ${path.relative(root, to)}: ` +
            "the file already exists. Two pages have the same URL."
        )
      }
    }

    for (const [from, to] of moves) {
      fs.mkdirSync(path.dirname(to), { recursive: true })
      fs.renameSync(from, to)
    }

    fs.rmSync(source, { recursive: true, force: true })
  },

  /**
   * Writes the root index.html for static sites. The page reads the locale cookie
   * and sends the browser to the stored locale or to the default locale.
   */
  writeDetectPage(dir: URL, config: ResolvedI18nConfig): void {
    const supported = config.locales.map((l: LocaleConfig) => l.code)

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <script>
      const supported = ${JSON.stringify(supported)};
      const base = ${JSON.stringify(config.base)};
      const defaultLocale = ${JSON.stringify(config.defaultLocale)};
      const stored = document.cookie.split("; ").find(r => r.startsWith("locale="))?.split("=")[1];
      const locale = (stored && supported.includes(stored)) ? stored : defaultLocale;
      window.location.replace(base + "/" + locale + "/");
    </script>
  </head>
  <body></body>
</html>`

    fs.writeFileSync(new URL("index.html", dir), html)
  },
}
