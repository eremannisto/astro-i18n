import {
  Locale
} from "../chunk-GN7TZPCV.js";

// src/detect/server.ts
var prerender = false;
var GET = ({ request, cookies, redirect }) => {
  const stored = cookies.get("locale")?.value;
  if (stored && Locale.supported.includes(stored)) {
    return redirect(`/${stored}/`, 302);
  }
  const header = request.headers.get("accept-language") ?? "";
  const preferred = header.split(",")[0].split(";")[0].split("-")[0].trim().toLowerCase();
  const locale = Locale.supported.includes(preferred) ? preferred : Locale.fallback;
  cookies.set("locale", locale, { path: "/" });
  return redirect(`/${locale}/`, 302);
};
export {
  GET,
  prerender
};
