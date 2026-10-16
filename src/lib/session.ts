// Client-side admin session token helpers.
//
// The preview panel (and some browsers with strict third-party-cookie
// blocking, e.g. Safari iOS) can drop the admin session cookie when the site
// is embedded in an iframe. To keep the admin panel working everywhere, the
// server also accepts the session token via the X-Session-Token header. The
// token lives in sessionStorage (with an in-memory fallback) so it is cleared
// when the tab closes.

const TOKEN_KEY = "studyshelf_admin_token";

export const SESSION_TOKEN_HEADER = "X-Session-Token";

let memoryToken: string | null = null;

export function getSessionToken(): string | null {
  if (memoryToken) return memoryToken;
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string): void {
  memoryToken = token;
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable (private mode etc.) — memory token still works
    // for as long as this tab is alive.
  }
}

export function clearSessionToken(): void {
  memoryToken = null;
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore.
  }
}

// fetch wrapper that attaches the admin session token (when present).
export async function adminFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getSessionToken();
  if (token) headers.set(SESSION_TOKEN_HEADER, token);
  return fetch(input, { ...init, headers, cache: "no-store" });
}
