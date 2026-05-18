const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL ?? "https://directus-proxy.alvizblas.workers.dev";

const SESSION_KEY = "sessionToken";

export { DIRECTUS_URL };

export function getSessionToken(): string {
  return localStorage.getItem(SESSION_KEY) ?? "";
}

export function setSessionToken(token: string): void {
  localStorage.setItem(SESSION_KEY, token);
}

export function clearSessionToken(): void {
  localStorage.removeItem(SESSION_KEY);
}

export async function directusFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getSessionToken();
  const headers = new Headers(init.headers as HeadersInit | undefined);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(DIRECTUS_URL + path, { ...init, headers });
  if (res.status === 401) {
    clearSessionToken();
    localStorage.removeItem("authRole");
    window.dispatchEvent(new CustomEvent("session-expired"));
  }
  return res;
}
