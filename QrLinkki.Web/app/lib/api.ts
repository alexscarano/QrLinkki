import { Alert } from 'react-native';
import Constants from 'expo-constants';

// Permite configurar a URL base da API em tempo de execução via globalThis.__API_URL__ ou setBaseUrl()
// Não usamos fallback hardcoded: exigimos que a URL seja fornecida em runtime (fail-fast).
let BASE_URL: string | undefined = (globalThis as any).__API_URL__ ?? (Constants?.expoConfig as any)?.extra?.apiUrl;

export function setBaseUrl(url: string) {
  BASE_URL = url;
}

let token: string | null = null;

export function setToken(t: string | null) {
  token = t;
}

// Suporte para handler de não-autorizado: consumidores podem registrar uma função para ser executada quando um 401 for recebido
let unauthorizedHandler: (() => void) | null = null;

export function registerUnauthorizedHandler(fn: (() => void) | null) {
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

  console.debug('jsonFetch:request', { url: `${BASE_URL}${path}`, method: options.method ?? 'GET', headers });

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    // chama o handler de não-autorizado ao receber 401 para que o app possa limpar a sessão
    if (res.status === 401) {
      try {
        unauthorizedHandler && unauthorizedHandler();
      } catch (e) {
        // ignora erros dentro do handler
      }
    }

    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText} - ${text}`);
  }

  // Sem conteúdo (204)
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

// Helpers de usuário
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
  return await jsonFetch(`/api/users/${userId}`, {
    method: 'DELETE',
  });
}

// Valida token chamando um endpoint protegido. Retorna o DTO do usuário quando o token é válido.
export async function validateToken() {
  console.debug('validateToken:start');
  try {
    const data = await jsonFetch('/api/auth/me');
    console.debug('validateToken:ok', { user: data });
    return data;
  } catch (e) {
    console.debug('validateToken:error', e);
    throw e;
  }
}

export function safeAction(fn: () => Promise<any>, errMsg = 'Erro') {
  return fn().catch((err) => {
    console.error(err);
    Alert.alert(errMsg, String(err));
  });
}

// Fornece um export padrão inofensivo para que o expo-router trate este arquivo como um módulo de rota válido.
// Na prática este arquivo é um módulo utilitário; o cliente real fica em `../lib/api.ts`.
import React from 'react';
export default function _ApiPlaceholder(): React.ReactElement | null {
  return null;
}
