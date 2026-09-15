/**
 * Browser-side Pusher subscription. The frontend connects to Pusher directly
 * (no persistent connection to our own serverless API needed) and gets
 * notified when the server pushes a resource change via server/realtime.ts.
 *
 * If VITE_PUSHER_KEY isn't set, subscribe() is a no-op and callers should
 * keep relying on their own polling fallback.
 */

import Pusher from 'pusher-js';

export type RealtimeResource = 'orders' | 'tables' | 'categories' | 'menu' | 'cafe' | 'service_requests';

let pusher: Pusher | null | undefined;

function getPusher(): Pusher | null {
  if (pusher !== undefined) return pusher;

  const key = import.meta.env.VITE_PUSHER_KEY as string | undefined;
  const cluster = import.meta.env.VITE_PUSHER_CLUSTER as string | undefined;
  if (!key || !cluster) {
    pusher = null;
    return pusher;
  }

  pusher = new Pusher(key, { cluster });
  return pusher;
}

// The shared database now holds every cafe's data, so each cafe gets its own
// Pusher channel — otherwise a change on one cafe would refresh every other
// cafe's open tabs too.
export function subscribeToResourceChanges(
  cafeId: string,
  onChange: (resource: RealtimeResource) => void
): () => void {
  const client = getPusher();
  if (!client || !cafeId) return () => {};

  const channelName = `cafe-${cafeId}`;
  const channel = client.subscribe(channelName);
  const handler = (data: { resource: RealtimeResource }) => onChange(data.resource);
  channel.bind('resource-updated', handler);

  return () => {
    channel.unbind('resource-updated', handler);
    client.unsubscribe(channelName);
  };
}

export function isRealtimeEnabled(): boolean {
  return getPusher() !== null;
}
