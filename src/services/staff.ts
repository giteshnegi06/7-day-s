import { AdminUser } from '../types';

// Staff accounts are managed and authenticated straight against the server —
// unlike the rest of the app's data, there's no localStorage-cached copy or
// offline-first optimistic write here, since a login must actually be
// verified by the backend and an account list should never silently drift
// out of sync with who can log in.
const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api';
// This app serves exactly one cafe — used as a fallback in login() below in
// case the caller's own cached cafe info (cafe.id) hasn't loaded yet.
const CAFE_ID = '7-days';

// The backend now issues a session token on login (the shared database can no
// longer tell staff apart by which cafe's dedicated DB they hit). Kept as a
// sibling to the 'cafe_staff_user' key App.tsx already persists the signed-in
// account under, in the same sessionStorage store.
const AUTH_TOKEN_KEY = 'cafe_staff_token';

function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string): void {
  try {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // storage unavailable — the token simply won't survive a reload
  }
}

// Exported so other services making staff-authenticated calls (storage.ts,
// serviceRequests.ts) can attach the same token, and so App.tsx can drop it
// on logout.
export function getAuthToken(): string | null {
  return getStoredToken();
}

export function clearAuthToken(): void {
  try {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json().catch(() => null);
  // Auth endpoints report expected failures (wrong password, expired link)
  // as 200 + { ok: false } so they don't show up as console errors.
  if (!res.ok || (body && body.ok === false)) {
    throw new Error((body && body.error) || `Request failed (${res.status})`);
  }
  return body as T;
}

// Same as request(), but for endpoints that require the signed-in staff
// member's session token. A 401 means the token is missing/expired/invalid —
// treated the same as bad credentials (an error is thrown) and the stale
// token is dropped so nothing keeps retrying with it.
async function authRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const res = await fetch(`${apiBase}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const body = await res.json().catch(() => null);
  if (res.status === 401) {
    clearAuthToken();
  }
  if (!res.ok || (body && body.ok === false)) {
    throw new Error((body && body.error) || `Request failed (${res.status})`);
  }
  return body as T;
}

export interface NewStaffInput {
  name: string;
  email: string;
  password: string;
  role: 'kitchen' | 'staff';
}

export const staffService = {
  list(): Promise<AdminUser[]> {
    return authRequest<AdminUser[]>('/admin-users');
  },

  add(input: NewStaffInput): Promise<AdminUser> {
    return authRequest<AdminUser>('/admin-users', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  remove(id: string): Promise<void> {
    return authRequest<void>(`/admin-users/${id}`, { method: 'DELETE' });
  },

  resetPassword(id: string, password: string): Promise<AdminUser> {
    return authRequest<AdminUser>(`/admin-users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    });
  },

  // Cafe-scoped now that all cafes share one database — the server can no
  // longer tell staff apart by which dedicated DB the request hit.
  login(cafeId: string, email: string, password: string): Promise<AdminUser> {
    return request<{ token: string; user: AdminUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cafeId: cafeId || CAFE_ID, email, password }),
    }).then(({ token, user }) => {
      setStoredToken(token);
      return user;
    });
  },

  // Forgot-password, step 1: asks the server to email a one-time reset link.
  forgotPassword(email: string): Promise<{ ok: true; message: string }> {
    return request<{ ok: true; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ cafeId: CAFE_ID, email }),
    });
  },

  // Forgot-password, step 2: the token from that link plus the new password.
  resetPasswordWithToken(token: string, newPassword: string): Promise<{ ok: true; email: string }> {
    return request<{ ok: true; email: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  // Self-service: the signed-in person proves they know the current password.
  changePassword(email: string, currentPassword: string, newPassword: string): Promise<AdminUser> {
    return authRequest<AdminUser>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ email, currentPassword, newPassword }),
    });
  },
};
