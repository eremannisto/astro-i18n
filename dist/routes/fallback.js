// src/routes/fallback.ts
var prerender = false;
var ALL = () => new Response(null, { status: 404 });
export {
  ALL,
  prerender
};
