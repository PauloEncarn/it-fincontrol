const TOKEN_KEY = 'token';

const isBrowser = () => typeof window !== 'undefined';

const decodeBase64Url = (value) => {
  const base64 = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return atob(padded);
};

export const getTokenPayload = (token) => {
  if (!token) return null;

  try {
    return JSON.parse(decodeBase64Url(token.split('.')[1] || ''));
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payload = getTokenPayload(token);
    if (!payload?.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

export const clearStoredToken = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
};

export const setStoredToken = (token, remember = false) => {
  if (!isBrowser()) return;
  clearStoredToken();
  const storage = remember ? window.localStorage : window.sessionStorage;
  storage.setItem(TOKEN_KEY, token);
};

export const getStoredToken = () => {
  if (!isBrowser()) return null;

  const sessionToken = window.sessionStorage.getItem(TOKEN_KEY);
  const localToken = window.localStorage.getItem(TOKEN_KEY);
  const token = sessionToken || localToken;

  if (!token || isTokenExpired(token)) {
    clearStoredToken();
    return null;
  }

  return token;
};
