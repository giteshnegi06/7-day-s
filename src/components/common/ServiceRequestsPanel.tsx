import React from 'react';
import { Droplets, BellRing, Check } from 'lucide-react';
import { usePendingServiceRequests, SERVICE_REQUEST_LABELS } from '../../services/serviceRequests';
import { soundService } from '../../services/sound';

interface ServiceRequestsPanelProps {
  theme: 'dark' | 'light';
}

function formatAge(createdAt: number, now: number): string {
  const secs = Math.max(0, Math.round((now - createdAt) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  return `${mins} min ago`;
}

// Pending "Need Water" / "Call Server" requests, oldest first, each with a
// Done button. Shown only in the Admin console: these are floor-staff jobs,
// so they deliberately stay off the Kitchen display and never distract the
// cooks. Renders nothing when there is nothing waiting so it never takes up
// space on a quiet floor.
export const ServiceRequestsPanel: React.FC<ServiceRequestsPanelProps> = ({ theme }) => {
  const { requests, resolve } = usePendingServiceRequests();
  const [now, setNow] = React.useState(Date.now());
  const seenIds = React.useRef<Set<string> | null>(null);

  React.useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(t);
  }, []);

  // Ring once for each request the first time this screen sees it. The very
  // first list after mount is treated as already-known so reloading a staff
  // screen doesn't re-ring for everything still open.
  React.useEffect(() => {
    if (seenIds.current === null) {
      seenIds.current = new Set(requests.map((r) => r.id));
      return;
    }
    let isNew = false;
    for (const r of requests) {
      if (!seenIds.current.has(r.id)) {
        seenIds.current.add(r.id);
        isNew = true;
      }
    }
    if (isNew) soundService.playStatusUpdateBlip();
  }, [requests]);

  if (requests.length === 0) return null;

  const dark = theme === 'dark';

  return (
    <div
      className={`rounded-3xl border p-4 space-y-3 ${
        dark ? 'bg-stone-800 border-amber-500/40' : 'bg-amber-50 border-amber-200 shadow-2xs'
      }`}
    >
      <div className="flex items-center gap-2">
        <BellRing className={`w-4 h-4 ${dark ? 'text-amber-400' : 'text-amber-600'}`} />
        <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-stone-900'}`}>
          Table Requests
        </h3>
        <span
          className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
            dark ? 'bg-amber-500 text-stone-950' : 'bg-amber-600 text-white'
          }`}
        >
          {requests.length}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {requests.map((r) => {
          const Icon = r.type === 'water' ? Droplets : BellRing;
          return (
            <div
              key={r.id}
              className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 border ${
                dark ? 'bg-stone-900 border-stone-700' : 'bg-white border-amber-200/70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    r.type === 'water'
                      ? dark ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-700'
                      : dark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className={`font-black text-sm truncate ${dark ? 'text-white' : 'text-stone-900'}`}>
                    {r.tableNumber}
                  </div>
                  <div className={`text-[11px] font-semibold ${dark ? 'text-stone-400' : 'text-stone-500'}`}>
                    {SERVICE_REQUEST_LABELS[r.type]} • {formatAge(r.createdAt, now)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => resolve(r.id)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  dark
                    ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
                title="Mark as handled"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
