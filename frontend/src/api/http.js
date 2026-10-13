import { ApiError } from './errors.js';

const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'pf_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY)
};

async function request(method, path, { body, params } = {}) {
  const query = params
    ? new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')).toString()
    : '';
  const headers = { Accept: 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${BASE}${path}${query ? `?${query}` : ''}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const isAuthCall = path.startsWith('/auth/login') || path.startsWith('/auth/register');
    if (response.status === 401 && !isAuthCall) window.dispatchEvent(new Event('pf:unauthorized'));
    throw new ApiError(response.status, data.message || 'Something went wrong', data.errors);
  }
  return data;
}

const get = (path, params) => request('GET', path, { params });
const post = (path, body) => request('POST', path, { body: body ?? {} });
const put = (path, body) => request('PUT', path, { body });
const patch = (path, body) => request('PATCH', path, { body: body ?? {} });
const del = (path) => request('DELETE', path);

export const httpApi = {
  mode: 'server',
  auth: {
    login: (payload) => post('/auth/login', payload),
    register: (payload) => post('/auth/register', payload),
    me: async () => (await get('/auth/me')).user
  },
  users: {
    list: async (params) => (await get('/users', params)).users,
    updateMe: async (data) => (await patch('/users/me', data)).user,
    changePassword: (data) => patch('/users/me/password', data),
    setRole: async (id, role) => (await patch(`/users/${id}/role`, { role })).user,
    remove: (id) => del(`/users/${id}`)
  },
  projects: {
    list: async (params) => (await get('/projects', params)).projects,
    get: async (id) => (await get(`/projects/${id}`)).project,
    create: async (data) => (await post('/projects', data)).project,
    update: async (id, data) => (await put(`/projects/${id}`, data)).project,
    remove: (id) => del(`/projects/${id}`),
    addMember: async (id, userId) => (await post(`/projects/${id}/members`, { userId })).project,
    removeMember: async (id, userId) => (await del(`/projects/${id}/members/${userId}`)).project
  },
  tasks: {
    list: async (params) => (await get('/tasks', params)).tasks,
    create: async (data) => (await post('/tasks', data)).task,
    update: async (id, data) => (await put(`/tasks/${id}`, data)).task,
    move: async (id, data) => (await patch(`/tasks/${id}/move`, data)).task,
    remove: (id) => del(`/tasks/${id}`)
  },
  comments: {
    list: async (taskId) => (await get(`/tasks/${taskId}/comments`)).comments,
    add: async (taskId, body) => (await post(`/tasks/${taskId}/comments`, { body })).comment,
    remove: (id) => del(`/comments/${id}`)
  },
  notifications: {
    list: () => get('/notifications'),
    markRead: (id) => patch(`/notifications/${id}/read`),
    markAllRead: () => post('/notifications/read-all'),
    remove: (id) => del(`/notifications/${id}`)
  },
  analytics: {
    overview: () => get('/analytics/overview')
  }
};
