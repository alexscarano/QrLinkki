import { Alert } from 'react-native';
import Constants from 'expo-constants';
import { logger } from './logger';

// URL base configurável em tempo de execução. Não existe fallback hardcoded;
// exigimos que `globalThis.__API_URL__` ou `Constants.expoConfig.extra.apiUrl` esteja definido.
let BASE_URL: string | undefined = (globalThis as any).__API_URL__ ?? (Constants?.expoConfig as any)?.extra?.apiUrl;

export function setBaseUrl(url: string) {
  BASE_URL = url;
}

let token: string | null = null;

export function setToken(t: string | null) {
  token = t;
}

// Suporte a handler para respostas não autorizadas: quem chamar pode registrar uma função que será executada quando um 401 for recebido
let unauthorizedHandler: ((info?: { url: string; method: string; status: number; body?: string }) => void) | null = null;

export function registerUnauthorizedHandler(fn: ((info?: { url: string; method: string; status: number; body?: string }) => void) | null) {
  unauthorizedHandler = fn;
}

async function jsonFetch(path: string, options: RequestInit = {}) {
  if (!BASE_URL) {
    throw new Error('API base URL is not configured. Define `globalThis.__API_URL__` or set `expo.extra.apiUrl` via app.config.js.');
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const requestUrl = `${BASE_URL}${path}`;
  const method = (options.method ?? 'GET') as string;
  logger.debug('jsonFetch:request', { url: requestUrl, method, headers });

  const res = await fetch(requestUrl, {
    ...options,
    headers,
  });

  if (!res.ok) {
    // Ler o corpo antes de notificar o handler para que possamos
    // fornecer contexto (útil para diagnóstico).
    const text = await res.text();

    // chamar o handler de não autorizado (401) apenas quando de fato enviamos um token
    // (evita tratar 401s de login/register como falha de uma sessão já autenticada)
    if (res.status === 401 && token) {
      try {
        unauthorizedHandler && unauthorizedHandler({ url: requestUrl, method, status: res.status, body: text });
      } catch (e) {
        // ignorar erros do handler
      }
    }

    logger.warn('jsonFetch:response-not-ok', { url: requestUrl, method, status: res.status, statusText: res.statusText, body: text });
    throw new Error(`${res.status} ${res.statusText} - ${text}`);
  }

  // Sem conteúdo
  if (res.status === 204) return null;

  const data = await res.json();
  // logger.debug('jsonFetch:response-ok', { url: path, data }); // Debug temporário
  if (path.includes('/api/links/')) {
    logger.debug('jsonFetch:link-details', { url: path, keys: Object.keys(data), sample: data });
  }
  return data;
}

export async function login(email: string, password: string) {
  const data = await jsonFetch('/api/auth', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return data?.token as string | undefined;
}

export async function register(email: string, password: string) {
  return await jsonFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getLinks() {
  return await jsonFetch('/api/links');
}

export async function getLink(code: string) {
  return await jsonFetch(`/api/links/${code}`);
}

export async function createLink(linkDto: any) {
  return await jsonFetch('/api/links', {
    method: 'POST',
    body: JSON.stringify(linkDto),
  });
}

export async function updateLink(code: string, linkDto: any) {
  return await jsonFetch(`/api/links/${code}`, {
    method: 'PUT',
    body: JSON.stringify(linkDto),
  });
}

export async function deleteLink(code: string) {
  return await jsonFetch(`/api/links/${code}`, {
    method: 'DELETE',
  });
}

// User CRUD helpers
export async function getUser(userId: string) {
  return await jsonFetch(`/api/users/${userId}`);
}

export async function updateUser(userId: string, body: any) {
  return await jsonFetch(`/api/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteUser(userId: string) {
  logger.debug('api.deleteUser:called', { userId });
  return await jsonFetch(`/api/users/${userId}`, {
    method: 'DELETE',
  });
}

// Validate token by calling a protected endpoint. Returns user DTO when token is valid.
export async function validateToken() {
  logger.debug('validateToken:start');
  try {
    const data = await jsonFetch('/api/auth/me');
    logger.debug('validateToken:ok', { user: data });
    return data;
  } catch (e) {
    logger.error('validateToken:error', e instanceof Error ? e : new Error(String(e)));
    throw e;
  }
}

export function safeAction(fn: () => Promise<any>, errMsg = 'Erro') {
  return fn().catch((err) => {
    logger.error(errMsg, err instanceof Error ? err : new Error(String(err)));
    // Antes exibíamos um Alert bloqueante aqui. Agora propagamos o erro para os chamadores
    // para que os componentes de UI possam apresentar toasts via o ToastProvider.
    throw err;
  });
}
