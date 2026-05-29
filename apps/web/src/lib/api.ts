/**
 * Shared API base URL and auth helpers.
 * In dev, use relative URLs so Vite proxies /api -> localhost:8000.
 */
export const getApiBase = (): string => {
  const configured = (import.meta.env.VITE_API_URL || '').trim();
  return configured.replace(/\/$/, '');
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('agentforge_token');
};

export const getAuthHeaders = (token?: string | null): HeadersInit => {
  const authToken = token ?? getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
};

export const apiUrl = (path: string): string => {
  const base = getApiBase();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${normalizedPath}` : normalizedPath;
};
