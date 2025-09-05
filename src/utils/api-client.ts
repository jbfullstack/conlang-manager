import axios from 'axios';
import CryptoJS from 'crypto-js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/; // ULID base32 RFC, 26 chars
const CUID_LIKE_RE = /^c[a-z0-9]{8,}$/i; // assez robuste pour Prisma cuid/cuid2

function isValidId(v?: string | null): v is string {
  return !!v && (UUID_RE.test(v) || ULID_RE.test(v) || CUID_LIKE_RE.test(v));
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
  return sid && isValidId(sid) ? sid : null; // renvoie null si slug / invalide
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  withCredentials: true,
  // ⬅️ Ne jette plus sur 4xx/5xx : on gère comme fetch()
  validateStatus: () => true,
});

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/** --- Utilitaires localStorage pour l'espace courant (optionnels ailleurs) --- */
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

// ---------- HMAC ----------
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
  const needs = (pathname: string) =>
    [
      '/api/compositions',
      '/api/concepts',
      '/api/properties',
      '/api/properties/categories',
      '/api/dictionary',
      '/api/dictionary/search',
    ].some((p) => pathname.startsWith(p));

  const base =
    typeof window === 'undefined'
      ? 'http://localhost' // base neutre pour URL.parse côté SSR
      : window.location.origin;

  try {
    const u = new URL(url, base);
    if (!needs(u.pathname)) {
      return url; // laisse tel quel (et garde forme relative si c'était relatif)
    }
    const sid = getSpaceIdFromStorageOrCookie();
    if (!sid) return url; // n'injecte rien si pas un UUID valide

    // idempotent
    u.searchParams.set('spaceId', sid);

    // Retourne chemin relatif + query (compatible baseURL + signature)
    return u.pathname + (u.search ? u.search : '');
  } catch {
    return url;
  }
}

// ---------- Intercepteur : signature + headers + x-space-id ----------
api.interceptors.request.use((config) => {
  const timestamp = Date.now().toString();
  const method = (config.method || 'GET').toUpperCase();

  // S'assurer d'avoir un headers mutable
  (config.headers as any) = (config.headers as any) || {};

  let url = config.url || '/';

  // Recompose l'URL avec params éventuels AVANT injection du spaceId
  if (config.params) {
    const qs = new URLSearchParams(config.params as any).toString();
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    // ⬅️ IMPORTANT : on nettoie pour éviter que Axios les ré-ajoute
    (config as any).params = undefined;
  }

  // Attache spaceId dans l'URL si nécessaire (cohérent avec la signature)
  url = attachSpaceIdIfNeeded(url);
  config.url = url;

  const body = config.data ?? '';
  const signature = signRequest(method, url, body, timestamp);

  if (method !== 'GET' && method !== 'HEAD') {
    (config.headers as any)['Content-Type'] =
      (config.headers as any)['Content-Type'] || 'application/json';
  }
  (config.headers as any)['x-app-timestamp'] = timestamp;
  (config.headers as any)['x-app-signature'] = signature;
  (config.headers as any)['x-app-key'] = process.env.NEXT_PUBLIC_APP_PUBLIC_KEY || '';

  // --- x-space-id uniquement si UUID valide (sinon on s'abstient)
  const hasHeader = !!(config.headers as any)['x-space-id'];
  if (!hasHeader) {
    const sid = getSpaceIdFromStorageOrCookie();
    if (sid) {
      (config.headers as any)['x-space-id'] = sid;
    }
  }

  return config;
});

// ==== léger wrapper fetch basé sur axios ====
// -> même ergonomie que window.fetch (ne jette pas, expose ok/status, etc.)
export const fetch = async (url: string, method: HttpMethod = 'GET', body?: any) => {
  // Idempotent: l'intercepteur le fera aussi, mais on le fait ici au cas où
  const finalUrl = attachSpaceIdIfNeeded(url);

  // Axios ne jette pas grâce à validateStatus:true -> comportement fetch-like
  const res = await api.request({ method, url: finalUrl, data: body });

  return {
    ok: res.status >= 200 && res.status < 300,
    status: res.status,
    statusText: res.statusText,
    headers: { get: (name: string) => (res.headers as any)[name.toLowerCase()] },
    json: async () => res.data,
    text: async () => {
      try {
        return typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      } catch {
        return String(res.data);
      }
    },
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

// Compositions CRUD
export const updateComposition = (id: string, payload: any) =>
  fetch(`/api/compositions/${id}`, 'PUT', payload);
export const deleteComposition = (id: string) => fetch(`/api/compositions/${id}`, 'DELETE');

export const patchSpaceMember = (id: string, body: any) =>
  fetch(`/api/spaces/${id}/members?spaceId=${id}`, 'PATCH', body);

// fetcher signé (pour SWR)
export const signedFetcher = async (url: string) => {
  const res = await fetch(url); // wrapper ci-dessus
  if (!res.ok) {
    // Fournit un message utile côté UI (au lieu d'un throw Axios brut)
    const msg = await res.text();
    throw new Error(`${res.status} ${res.statusText}${msg ? ` — ${msg}` : ''}`);
  }
  return res.json();
};

export default api;
