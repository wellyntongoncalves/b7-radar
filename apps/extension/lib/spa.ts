/**
 * SPA navigation watcher. Mercado Livre is a single-page app: navigating between
 * listings changes the URL without a full reload. To honor the spec rule "ao
 * mudar de anúncio, limpar os dados anteriores", we must observe URL changes and
 * re-bind the panel to the new listingId.
 *
 * This patches history.pushState/replaceState (SPAs use them) and listens to
 * popstate. Returns an unsubscribe function.
 */
export function onUrlChange(callback: (url: string) => void): () => void {
  let lastUrl = location.href;

  const emit = () => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      callback(lastUrl);
    }
  };

  const origPush = history.pushState;
  const origReplace = history.replaceState;

  history.pushState = function pushState(...args) {
    const ret = origPush.apply(this, args);
    queueMicrotask(emit);
    return ret;
  };
  history.replaceState = function replaceState(...args) {
    const ret = origReplace.apply(this, args);
    queueMicrotask(emit);
    return ret;
  };

  window.addEventListener('popstate', emit);

  return () => {
    history.pushState = origPush;
    history.replaceState = origReplace;
    window.removeEventListener('popstate', emit);
  };
}

/** Extracts the Mercado Livre listing id (MLB…) from a URL, or null. */
export function listingIdFromUrl(url: string): string | null {
  const match = url.match(/MLB-?\d+/i);
  return match ? match[0].replace('-', '') : null;
}
