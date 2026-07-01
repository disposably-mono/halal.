// Client-side acknowledgment of the essential-cookie notice. Stored in
// localStorage (not a cookie) so an app whose point is minimal cookies does not
// add one just to dismiss its own notice. All access is guarded for SSR and for
// browsers where storage is disabled (private mode).
export const COOKIE_ACK_KEY = "olps-cookie-ack";
const ACK_VALUE = "1";

export function hasAcknowledged(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(COOKIE_ACK_KEY) === ACK_VALUE;
  } catch {
    return false;
  }
}

export function acknowledge(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COOKIE_ACK_KEY, ACK_VALUE);
  } catch {
    // Storage unavailable (private mode / disabled) — notice will reappear; that
    // is acceptable for an informational notice.
  }
}
