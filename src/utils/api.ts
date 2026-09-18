/// <reference types="vite/client" />
// Centralized API configuration & fetch interceptor for Vercel <-> Render cross-origin communication

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/+$/, '');

export function getApiUrl(endpoint: string): string {
  if (!endpoint.startsWith('/api')) {
    return endpoint;
  }
  if (!API_BASE_URL) {
    return endpoint;
  }
  return `${API_BASE_URL}${endpoint}`;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('gym_token');
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gym_token', token);
  }
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gym_token');
  }
}

// Intercept browser fetch safely to:
// 1. Prefix VITE_API_URL when targeting /api endpoints
// 2. Attach Authorization: Bearer <token> from localStorage
// 3. Set credentials: 'include' for cross-origin cookies
if (typeof window !== 'undefined' && !(window as any).__api_fetch_intercepted__) {
  try {
    const rawFetch = (typeof window.fetch === 'function' ? window.fetch : fetch).bind(window);

    const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

      if (typeof url === 'string' && url.startsWith('/api') && API_BASE_URL) {
        url = `${API_BASE_URL}${url}`;
      }

      const modifiedInit: RequestInit = {
        ...init,
        credentials: init?.credentials || 'include'
      };

      const token = getAuthToken();
      if (token) {
        const headers = new Headers(
          modifiedInit.headers || (typeof input === 'object' && 'headers' in input ? (input as any).headers : undefined)
        );
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        modifiedInit.headers = headers;
      }

      return rawFetch(url, modifiedInit);
    };

    let applied = false;
    try {
      Object.defineProperty(window, 'fetch', {
        value: customFetch,
        writable: true,
        configurable: true,
        enumerable: true
      });
      applied = true;
    } catch {
      try {
        (window as any).fetch = customFetch;
        applied = true;
      } catch {
        try {
          if (typeof Window !== 'undefined' && Window.prototype) {
            Object.defineProperty(Window.prototype, 'fetch', {
              value: customFetch,
              writable: true,
              configurable: true,
              enumerable: true
            });
            applied = true;
          }
        } catch {
          // In strictly sandboxed iframes where fetch is read-only, native fetch is safely retained
        }
      }
    }

    if (applied) {
      (window as any).__api_fetch_intercepted__ = true;
    }
  } catch {
    // Non-fatal fallback
  }
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = getApiUrl(endpoint);
  const token = getAuthToken();
  const headers = new Headers(options.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, {
    ...options,
    credentials: options.credentials || 'include',
    headers
  });
}
