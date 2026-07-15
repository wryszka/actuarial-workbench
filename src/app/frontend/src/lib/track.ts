/**
 * Fire-and-forget usage beacon. The server records who (from the OAuth proxy
 * headers) plus what/where. Uses sendBeacon so it survives the browser
 * navigating away to the external app; never blocks or throws.
 */
export function track(event: string, target = '', path = ''): void {
  try {
    const body = JSON.stringify({ event, target, path: path || window.location.pathname });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
    }
  } catch {
    /* tracking must never break the app */
  }
}
