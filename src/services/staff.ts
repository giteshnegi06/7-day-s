import { AdminUser } from '../types';

// Staff accounts are managed and authenticated straight against the server —
// unlike the rest of the app's data, there's no localStorage-cached copy or
// offline-first optimistic write here, since a login must actually be
// verified by the backend and an account list should never silently drift
// out of sync with who can log in.
const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
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
    return request<AdminUser[]>('/admin-users');
  },

  add(input: NewStaffInput): Promise<AdminUser> {
    return request<AdminUser>('/admin-users', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  remove(id: string): Promise<void> {
    return request<void>(`/admin-users/${id}`, { method: 'DELETE' });
  },

  resetPassword(id: string, password: string): Promise<AdminUser> {
    return request<AdminUser>(`/admin-users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    });
  },

  login(email: string, password: string): Promise<AdminUser> {
    return request<AdminUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Forgot-password, step 1: asks the server to email a one-time reset link.
  forgotPassword(email: string): Promise<{ ok: true; message: string }> {
    return request<{ ok: true; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
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
    return request<AdminUser>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ email, currentPassword, newPassword }),
    });
  },
};
