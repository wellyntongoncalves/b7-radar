// Minimal background service worker. In the MVP it only logs lifecycle; it is
// the future home for cached, tab-scoped calls to the official API (when the
// user connects their account) and for optional backend sync.
export default defineBackground(() => {
  // eslint-disable-next-line no-console
  console.info('[B7 Radar] service worker iniciado.');
});
