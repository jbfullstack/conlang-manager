import axios from 'axios';
import CryptoJS from 'crypto-js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUUID(v?: string | null): v is string {
  return !!v && UUID_RE.test(v);
}

function getSpaceIdFromStorageOrCookie(): string | null {
  // 1) LS d'abord
  let sid =
    (typeof window !== 'undefined' && localStorage.getItem('space.currentId')) ||
    (typeof window !== 'undefined' && localStorage.getItem('current.spaceId')) ||
    null;

  // 2) Cookie fallback
  if (!sid && typeof document !== 'undefined') {
    const m = document.cookie.match(/(?:^|;\s*)x-space-id=([^;]+)/);
    if (m) sid = decodeURIComponent(m[1]);
  }
  return sid && isUUID(sid) ? sid : null; // renvoie null si slug / invalide
}
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  withCredentials: true,
});

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/** --- Utilitaires localStorage pour l'espace courant --- */
const LS_SPACE_ID = 'space.currentId';
const LS_SPACE_NAME = 'space.currentName';

function readSpaceId(): string | null {
  try {
    return localStorage.getItem(LS_SPACE_ID);
  } catch {
    return null;
  }
}
function writeSpace(id: string, name?: string) {
  try {
    localStorage.setItem(LS_SPACE_ID, id);
    if (name) localStorage.setItem(LS_SPACE_NAME, name);
  } catch {}
}

// ---------- HMAC identique ----------
function signRequest(method: string, url: string, body: any, timestamp: string) {
  const secret = process.env.NEXT_PUBLIC_APP_SECRET_KEY || '';
  const pathWithSearch = url.startsWith('/') ? url : `/${url}`;
  let bodyString = '';
  if (body && (typeof body === 'string' ? body.length > 0 : Object.keys(body).length > 0)) {
    bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const payload = `${method.toUpperCase()}|${pathWithSearch}|${timestamp}|${bodyString}`;
  return CryptoJS.HmacSHA256(payload, secret).toString(CryptoJS.enc.Hex);
}

// ---------- Helper : attacher spaceId aux endpoints qui le requièrent ----------
export function attachSpaceIdIfNeeded(url: string): string {
  // On garde ta logique "est-ce que ce endpoint a besoin d'un spaceId ?"
  const needs = (pathname: string) => {
    // Exemple : adapte selon ta logique existante
    return [
      '/api/compositions',
      '/api/concepts',
      '/api/properties',
      '/api/properties/categories',
    ].some((p) => pathname.startsWith(p));
  };

  const base =
    typeof window === 'undefined'
      ? 'http://localhost' // base neutre pour URL sur SSR
      : window.location.origin;

  const u = new URL(url, base);
  if (!needs(u.pathname)) return url;

  const sid = getSpaceIdFromStorageOrCookie();
  if (!sid) return url; // <-- ne rien injecter si pas un UUID

  u.searchParams.set('spaceId', sid);
  return u.pathname + (u.search ? u.search : '');
}

// ---------- Intercepteur : signature + headers + x-space-id ----------
api.interceptors.request.use((config) => {
  const timestamp = Date.now().toString();
  const method = (config.method || 'GET').toUpperCase();

  let url = config.url || '/';
  if (config.params) {
    const qs = new URLSearchParams(config.params as any).toString();
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
  }

  // NEW: on attache spaceId dans l'URL si nécessaire (cohérent avec la signature)
  url = attachSpaceIdIfNeeded(url);
  config.url = url;

  const body = config.data ?? '';
  const signature = signRequest(method, url, body, timestamp);

  if (method !== 'GET' && method !== 'HEAD') {
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
  }
  config.headers['x-app-timestamp'] = timestamp;
  config.headers['x-app-signature'] = signature;
  config.headers['x-app-key'] = process.env.NEXT_PUBLIC_APP_PUBLIC_KEY || '';

  // --- Fallbacks robustes pour x-space-id
  try {
    // si déjà posé plus haut, on ne touche pas
    const hasHeader = !!(config.headers as any)['x-space-id'];

    // 1) autre clé LS possible
    if (!hasHeader && typeof window !== 'undefined') {
      const alt = localStorage.getItem('current.spaceId');
      if (alt) (config.headers as any)['x-space-id'] = alt;
    }

    // 2) cookie si toujours rien
    if (!(config.headers as any)['x-space-id'] && typeof document !== 'undefined') {
      const m = document.cookie.match(/(?:^|;\s*)x-space-id=([^;]+)/);
      if (m) (config.headers as any)['x-space-id'] = decodeURIComponent(m[1]);
    }
  } catch {
    /* no-op */
  }

  return config;
});

// ==== léger wrapper fetch basé sur axios ====

export const fetch = async (url: string, method: HttpMethod = 'GET', body?: any) => {
  const finalUrl = attachSpaceIdIfNeeded(url); // NEW: fallback côté client
  const res = await api.request({ method, url: finalUrl, data: body });
  return {
    ok: res.status >= 200 && res.status < 300,
    status: res.status,
    statusText: res.statusText,
    headers: { get: (name: string) => (res.headers as any)[name.toLowerCase()] },
    json: async () => res.data,
    text: async () => JSON.stringify(res.data),
  };
};

export const fetchPropertiesCategories = async () => await fetch('/api/properties/categories');

export const fetchProperties = (qs?: string) =>
  fetch(`/api/properties${qs ? (qs.startsWith('?') ? qs : `?${qs}`) : ''}`);

export const fetchPostProperties = async (payload: any) =>
  await fetch('/api/properties', 'POST', payload);
export const getProperties = () => api.get('/api/properties');
export const createProperties = (payload: any) => api.post('/api/properties', payload);
export const updateProperties = (id: string, payload: any) =>
  api.put(`/api/properties/${id}`, payload);
export const deleteProperties = (id: string) => api.delete(`/api/properties/${id}`);

export const fetchConceptsTypes = async () => await fetch('/api/concepts/types');

export const fetchConcepts = async () => await fetch('/api/concepts');
export const getConcepts = () => api.get('/api/concepts');
export const createConcept = (payload: any) => api.post('/api/concepts', payload);
export const updateConcept = (id: string, payload: any) => api.put(`/api/concepts/${id}`, payload);
export const deleteConcept = (id: string) => api.delete(`/api/concepts/${id}`);

export const fetchCompositions = async () => await fetch('/api/compositions');
export const fetchPostCompositions = async (payload: any) =>
  await fetch('/api/compositions', 'POST', payload);
export const getCompositions = () => api.get('/api/compositions');
export const createComposition = (payload: any) => api.post('/api/compositions', payload);

export const fetchPostSearchReverse = async (payload: any) =>
  await fetch('/api/search-reverse', 'POST', payload);
export const fetchPostAnalyzeComposition = async (payload: any) =>
  await fetch('/api/analyze-composition', 'POST', payload);

// Dictionnaire
export const fetchDictionary = (qs: string) =>
  fetch(`/api/dictionary/search${qs.startsWith('?') ? qs : `?${qs}`}`);

// Compositions CRUD (déjà là, mais pour mémoire)
export const updateComposition = (id: string, payload: any) =>
  fetch(`/api/compositions/${id}`, 'PUT', payload);
export const deleteComposition = (id: string) => fetch(`/api/compositions/${id}`, 'DELETE');

export const patchSpaceMember = (id: string, body: any) =>
  fetch(`/api/spaces/${id}/members?spaceId=${id}`, 'PATCH', body);

// fetcher signé (pratique pour SWR)
export const signedFetcher = async (url: string) => {
  const res = await fetch(url); // <=== ton wrapper ci-dessus
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json(); // retourne déjà les données
};

export default api;
