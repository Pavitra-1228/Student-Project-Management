import { USE_MOCK } from '../lib/constants.js';
import { httpApi, tokenStore } from './http.js';
import { mockApi } from './mock.js';

export const api = USE_MOCK ? mockApi : httpApi;
export const isDemo = USE_MOCK;
export const session = {
  get: () => localStorage.getItem('pf_token'),
  set: (token) => tokenStore.set(token),
  clear: () => tokenStore.clear()
};
export { ApiError } from './errors.js';
