import React, { useState } from 'react';
import { CafeInfo } from '../../types';
import { staffService } from '../../services/staff';
import { Lock, KeyRound, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';

interface ResetPasswordViewProps {
  cafe: CafeInfo;
  token: string;
  onDone: () => void;
}

// Landing page for the emailed "Forgot password?" link
// (/reset-password?token=...). Posts the token with the chosen password;
// the server checks the token is real, unused and unexpired.
export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ cafe, token, onDone }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doneEmail, setDoneEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Password and confirmation do not match');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await staffService.resetPasswordWithToken(token, newPassword);
      setDoneEmail(result.email);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full pl-9 pr-3 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium';

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">
        <div className="bg-stone-900 p-8 text-center text-white">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center mx-auto mb-3 font-black shadow-md">
            {doneEmail ? <ShieldCheck className="w-7 h-7" /> : <KeyRound className="w-7 h-7" />}
          </div>
          <h2 className="text-xl font-black tracking-tight">
            {doneEmail ? 'Password updated' : 'Choose a new password'}
          </h2>
          <p className="text-xs text-stone-400 mt-1">{cafe.name} Staff Portal</p>
        </div>

        <div className="p-8 space-y-5 text-xs">
          {doneEmail ? (
            <>
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl">
                The password for <span className="font-black">{doneEmail}</span> has been changed.
                You can sign in with it now.
              </div>
              <button
                type="button"
                onClick={onDone}
                className="w-full py-3 px-4 bg-stone-900 hover:bg-black text-white rounded-xl font-bold shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Go to sign in</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 font-semibold rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    autoFocus
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                <span>{isSubmitting ? 'Saving...' : 'Set New Password'}</span>
              </button>

              <p className="text-[11px] text-stone-400 text-center">
                This link works once and expires 30 minutes after it was requested.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
