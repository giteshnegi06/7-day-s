import { useEffect, useState } from 'react';
import { ServiceRequest, ServiceRequestType } from '../types';
import { storageService } from './storage';
import { isRealtimeEnabled } from './realtime';
import { getAuthToken, clearAuthToken } from './staff';

// Table assistance requests ("Need Water" / "Call Server"). These go straight
// to the server and are never cached locally — a request only matters while
// it is pending, and staff screens must show the same live list.
const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api';
// This app serves exactly one cafe — cafeBackend is now shared/multi-tenant,
// so create() (public) must say which cafe it's for; listPending()/resolve()
// are staff-only and get their cafe from the signed-in JWT instead.
const CAFE_ID = '7-days';

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

// Staff-only calls (viewing/resolving the board on the admin dashboard) need
// the signed-in staff member's session token; create() stays public — it's
// called from the customer's own order-tracking screen.
async function authRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
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
  if (!res.ok) {
    throw new Error((body && body.error) || `Request failed (${res.status})`);
  }
  return body as T;
}

export const serviceRequestService = {
  // Public (no auth) — polled by both the customer's own tracking screen and
  // the staff Kitchen display, which isn't necessarily logged in either.
  listPending(): Promise<ServiceRequest[]> {
    return request<ServiceRequest[]>(`/service-requests?cafeId=${encodeURIComponent(CAFE_ID)}`);
  },

  // Resolves to `duplicate: true` when that table already has the same kind
  // of request open, so the customer can be told staff are already on it.
  create(tableId: string, tableNumber: string, type: ServiceRequestType): Promise<ServiceRequest & { duplicate?: boolean }> {
    return request<ServiceRequest & { duplicate?: boolean }>('/service-requests', {
      method: 'POST',
      body: JSON.stringify({ cafeId: CAFE_ID, tableId, tableNumber, type }),
    });
  },

  resolve(id: string): Promise<ServiceRequest> {
    return authRequest<ServiceRequest>(`/service-requests/${id}/resolve`, { method: 'PATCH' });
  },
};

export const SERVICE_REQUEST_LABELS: Record<ServiceRequestType, string> = {
  water: 'Needs water',
  server: 'Calling server',
};

// Live list of pending requests for staff screens. Refetches on the realtime
// push and on a safety-net poll (frequent when Pusher isn't configured, since
// polling is then the only way a new request ever shows up).
export function usePendingServiceRequests(): {
  requests: ServiceRequest[];
  resolve: (id: string) => Promise<void>;
} {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      serviceRequestService
        .listPending()
        .then((list) => {
          if (!cancelled) setRequests(list);
        })
        .catch(() => {
          // keep showing the last good list
        });
    };

    refresh();
    const unsubscribe = storageService.subscribe((type) => {
      if (type === 'SERVICE_REQUESTS_UPDATED') refresh();
    });
    const interval = window.setInterval(refresh, isRealtimeEnabled() ? 20000 : 4000);

    return () => {
      cancelled = true;
      unsubscribe();
      window.clearInterval(interval);
    };
  }, []);

  const resolve = async (id: string) => {
    // Optimistic: drop it from the board immediately, restore if the server
    // refuses (e.g. another device already resolved it).
    const prev = requests;
    setRequests((list) => list.filter((r) => r.id !== id));
    try {
      await serviceRequestService.resolve(id);
    } catch {
      setRequests(prev);
    }
  };

  return { requests, resolve };
}
