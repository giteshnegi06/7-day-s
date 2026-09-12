import React, { useEffect, useState } from 'react';
import { BellRing, Loader2, Check, AlertTriangle } from 'lucide-react';
import { TableItem } from '../../types';
import { serviceRequestService } from '../../services/serviceRequests';

interface CallServerButtonProps {
  table: TableItem;
}

// Compact "Call Server" button for the sticky menu header, so a guest can
// page staff from the menu itself without first having placed an order.
// Uses the same service-request flow as the order-tracking screen: the
// request lands on the Kitchen display / Admin dashboard until marked done,
// and a second tap while one is already open doesn't page staff again.
export const CallServerButton: React.FC<CallServerButtonProps> = ({ table }) => {
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const handleClick = async () => {
    if (isSending) return;
    setIsSending(true);
    try {
      const result = await serviceRequestService.create(table.id, table.number, 'server');
      setToast({
        tone: 'ok',
        text: result.duplicate
          ? `A server is already on the way to ${table.number}.`
          : `Staff alerted — a server is on the way to ${table.number}.`,
      });
    } catch {
      setToast({
        tone: 'error',
        text: 'Could not reach the staff right now. Please try again or ask at the counter.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isSending}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 bg-white border-stone-200 text-stone-700 hover:border-amber-400 hover:text-amber-800 hover:bg-amber-50 disabled:opacity-60 disabled:cursor-wait cursor-pointer"
        title="Call a server to your table"
      >
        {isSending ? (
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
