import { getTokenStorage, removeTokenStorage } from './storage';
import * as api from './api';
import { logger } from './logger';

function isJwt(token: string) {
  return token.split('.').length === 3;
}

function parseJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(payload).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Returns the current user DTO when authenticated, or `null` when not.
export async function isAuthenticated(): Promise<any | null> {
  try {
    const token = await getTokenStorage();
    logger.debug('isAuthenticated:token-from-storage', { hasToken: !!token });
    if (!token) return null;

    // quick local JWT expiry check
    if (isJwt(token)) {
      const payload = parseJwtPayload(token);
      if (payload && payload.exp && Number(payload.exp) < Date.now() / 1000) {
        // expired
        try { await removeTokenStorage(); } catch {}
        return null;
      }
    }

    // set token for api helper and validate with backend
    api.setToken(token);
    try {
      logger.debug('isAuthenticated:validating-with-server');
      // validate by calling a protected endpoint. We expect a 200 and the user DTO when token is valid.
      const data = await api.validateToken();
      logger.debug('isAuthenticated:validateToken:ok', { user: data });
      return data ?? null;
    } catch (e) {
      // invalid on server
      logger.warn('isAuthenticated:validateToken:error', { error: e instanceof Error ? e.message : String(e) });
      try { await removeTokenStorage(); } catch {}
      api.setToken(null);
      return null;
    }
  } catch (e) {
    return null;
  }
}

export async function ensureAuthenticated(): Promise<boolean> {
  const ok = await isAuthenticated();
  return !!ok;
}
