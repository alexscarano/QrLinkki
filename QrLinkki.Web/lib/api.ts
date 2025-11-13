import { Alert } from 'react-native';

// URL base configurável em tempo de execução (é possível definir globalThis.__API_URL__ ou chamar setBaseUrl())
let BASE_URL: string = (globalThis as any).__API_URL__ ?? 'http://localhost:5000';

export function setBaseUrl(url: string) {
  BASE_URL = url;
}

let token: string | null = null;

export function setToken(t: string | null) {
  token = t;
}

// Suporte a handler para respostas não autorizadas: quem chamar pode registrar uma função que será executada quando um 401 for recebido
let unauthorizedHandler: (() => void) | null = null;

export function registerUnauthorizedHandler(fn: (() => void) | null) {
  unauthorizedHandler = fn;
}

async function jsonFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  console.debug('jsonFetch:request', { url: `${BASE_URL}${path}`, method: options.method ?? 'GET', headers });

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    // chamar o handler de não autorizado (401) apenas quando de fato enviamos um token
    // (evita tratar 401s de login/register como falha de uma sessão já autenticada)
    if (res.status === 401 && token) {
      try {
        unauthorizedHandler && unauthorizedHandler();
      } catch (e) {
        // ignorar erros do handler
      }
    }

    const text = await res.text();
    console.debug('jsonFetch:response-not-ok', { status: res.status, statusText: res.statusText, body: text });
    throw new Error(`${res.status} ${res.statusText} - ${text}`);
  }

  // Sem conteúdo
  if (res.status === 204) return null;

  const data = await res.json();
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

export function safeAction(fn: () => Promise<any>, errMsg = 'Erro') {
  return fn().catch((err) => {
    console.error(err);
    // Antes exibíamos um Alert bloqueante aqui. Agora propagamos o erro para os chamadores
    // para que os componentes de UI possam apresentar toasts via o ToastProvider.
    throw err;
  });
}
