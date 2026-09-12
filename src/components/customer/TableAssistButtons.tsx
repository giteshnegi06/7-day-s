import React, { useEffect, useState } from 'react';
import { BellRing, Droplets, Loader2, Check, AlertTriangle } from 'lucide-react';
import { TableItem, ServiceRequestType } from '../../types';
import { serviceRequestService } from '../../services/serviceRequests';

interface TableAssistButtonsProps {
  table: TableItem;
}

// "Need Water" / "Call Server" for the sticky menu header, so a guest can
// page staff from the menu itself without first having placed an order.
// Uses the same service-request flow as the order-tracking screen: the
// request lands on the Admin dashboard until marked done,
// and a second tap while one is already open doesn't page staff again.
export const TableAssistButtons: React.FC<TableAssistButtonsProps> = ({ table }) => {
  const [sending, setSending] = useState<ServiceRequestType | null>(null);
  const [toast, setToast] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const send = async (type: ServiceRequestType) => {
    if (sending) return;
    setSending(type);
    const what = type === 'water' ? 'water' : 'a server';
    try {
      const result = await serviceRequestService.create(table.id, table.number, type);
      setToast({
        tone: 'ok',
        text: result.duplicate
          ? `Staff have already been asked for ${what} — on the way to ${table.number}.`
          : `Staff alerted — ${what} is on the way to ${table.number}.`,
      });
    } catch {
      setToast({
        tone: 'error',
        text: 'Could not reach the staff right now. Please try again or ask at the counter.',
      });
    } finally {
      setSending(null);
    }
  };

  const base =
    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 bg-white border-stone-200 text-stone-700 disabled:opacity-60 disabled:cursor-wait cursor-pointer';

  return (
    <>
      <button
        type="button"
        onClick={() => send('water')}
        disabled={sending !== null}
        className={`${base} hover:border-sky-400 hover:text-sky-800 hover:bg-sky-50`}
        title="Ask for water"
      >
        {sending === 'water' ? (
          <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
        ) : (
          <Droplets className="w-4 h-4 text-sky-500" />
        )}
        <span className="hidden sm:inline">Need Water</span>
      </button>

      <button
        type="button"
        onClick={() => send('server')}
        disabled={sending !== null}
        className={`${base} hover:border-amber-400 hover:text-amber-800 hover:bg-amber-50`}
        title="Call a server to your table"
      >
        {sending === 'server' ? (
          <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
        ) : (
          <BellRing className="w-4 h-4 text-amber-600" />
        )}
        <span className="hidden sm:inline">Call Server</span>
      </button>

      {/* Confirmation toast — fixed so it's visible wherever the guest has
          scrolled, and above the sticky cart bar. */}
      {toast && (
        <div className="fixed top-4 inset-x-0 z-50 px-4 pointer-events-none">
          <div
            className={`max-w-md mx-auto p-3.5 border text-xs font-bold rounded-2xl text-center shadow-lg flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 ${
              toast.tone === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {toast.tone === 'ok' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}
    </>
  );
};
