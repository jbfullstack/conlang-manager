// src/utils/apiClient.ts
import axios from 'axios';
import CryptoJS from 'crypto-js';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  withCredentials: true,
});

// Fonction de signature HMAC
// --- remplace entièrement ta fonction signRequest ---
function signRequest(method: string, url: string, body: any, timestamp: string) {
  if (process.env.NEXT_PUBLIC_DEBUG_HMAC === 'true') {
    console.log('[HMAC FRONT]', {
      payload: `${method.toUpperCase()}|${url.startsWith('/') ? url : `/${url}`}|${timestamp}|${
        (body && (typeof body === 'string' ? body : JSON.stringify(body))) || ''
      }`,
    });
  }

  const secret = process.env.NEXT_PUBLIC_APP_SECRET_KEY || '';

  // Toujours un chemin commençant par "/" (et avec la query incluse si présente)
  const pathWithSearch = url.startsWith('/') ? url : `/${url}`;

  // GET / HEAD => body vide; sinon JSON compact (pas de {}) si rien
  let bodyString = '';
  if (body && (typeof body === 'string' ? body.length > 0 : Object.keys(body).length > 0)) {
    bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const payload = `${method.toUpperCase()}|${pathWithSearch}|${timestamp}|${bodyString}`;
  return CryptoJS.HmacSHA256(payload, secret).toString(CryptoJS.enc.Hex); // hex minuscule
}

// --- intercepteur (petit ajustement sur method/url/body) ---
api.interceptors.request.use((config) => {
  const timestamp = Date.now().toString();
  const method = (config.method || 'GET').toUpperCase();

  // 🔹 Recréer l'URL avec la query si config.params existe
  let url = config.url || '/';
  if (config.params) {
    const queryString = new URLSearchParams(config.params as any).toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const body = config.data ?? '';

  const signature = signRequest(method, url, body, timestamp);

  if (method !== 'GET' && method !== 'HEAD') {
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
  }
  config.headers['x-app-timestamp'] = timestamp;
  config.headers['x-app-signature'] = signature;
  config.headers['x-app-key'] = process.env.NEXT_PUBLIC_APP_PUBLIC_KEY || '';

  if (process.env.NEXT_PUBLIC_DEBUG_HMAC === 'true') {
    console.log('[HMAC FRONT]', {
      method,
      url,
      timestamp,
      bodyString: typeof body === 'string' ? body : JSON.stringify(body),
    });
  }

  return config;
});

//
// ==== Exports prêts à l’emploi ====
//

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export const fetch = async (url: string, method: HttpMethod = 'GET', body?: any) => {
  const res = await api.request({
    method,
    url,
    data: body,
  });

  return {
    ok: res.status >= 200 && res.status < 300,
    status: res.status,
    statusText: res.statusText,
    headers: {
      get: (name: string) => res.headers[name.toLowerCase()],
    },
    json: async () => res.data,
    text: async () => JSON.stringify(res.data),
  };
};

export const fetchPropertiesCategories = async () => await fetch('/api/properties/categories');

export const fetchProperties = async () => await fetch('/api/properties');
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

// fetcher signé (pratique pour SWR)
export const signedFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

export default api;
