import React, { useState } from 'react';
import { AdminUser, CafeInfo } from '../../types';
import { staffService } from '../../services/staff';
import { Lock, Mail, Loader2, KeyRound, ArrowLeft, MailCheck } from 'lucide-react';

interface AdminLoginProps {
  cafe: CafeInfo;
  onLoginSuccess: (account: AdminUser) => void;
}

// Every sign-in is verified by the server against the admin_users table —
// there is no built-in or demo account. Which portal the person lands in
// (admin console vs kitchen display) is decided by the role stored on their
// account, not by anything chosen on this screen.
export const AdminLogin: React.FC<AdminLoginProps> = ({ cafe, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // "Forgot password?" — the server emails a one-time link to the account's
  // address; the link opens /reset-password where the new password is set.
  const [sentTo, setSentTo] = useState<string | null>(null);

  const switchMode = (next: 'login' | 'forgot') => {
    setMode(next);
    setErrorMsg(null);
    setPassword('');
    setSentTo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password.trim()) {
      setErrorMsg('Please enter email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      const account = await staffService.login(cafe.id, trimmedEmail, password);
      onLoginSuccess(account);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await staffService.forgotPassword(trimmedEmail);
      setSentTo(trimmedEmail);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not send the reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full pl-9 pr-3 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium';

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-stone-900 p-8 text-center text-white relative">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center mx-auto mb-3 font-black shadow-md">
            {mode === 'forgot' ? <KeyRound className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
          </div>
          <h2 className="text-xl font-black tracking-tight">
            {mode === 'forgot' ? 'Reset Password' : `${cafe.name} Staff Portal`}
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            {mode === 'forgot'
              ? "We'll email you a link to choose a new password"
              : 'Protected administrative & kitchen management console'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl">
              {errorMsg}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-stone-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-stone-900 hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
              </button>
            </form>
          ) : sentTo ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-3">
                <MailCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Check your inbox</p>
                  <p>
                    If <span className="font-black">{sentTo}</span> has a staff account, we've sent it a
                    link to choose a new password. The link works once and expires in 30 minutes.
                  </p>
                  <p className="text-emerald-700/80">Not there? Check your spam folder.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full py-2 text-stone-500 hover:text-stone-800 font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to sign in</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="The email on your staff account"
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                <span>{isSubmitting ? 'Sending...' : 'Email Me a Reset Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full py-2 text-stone-500 hover:text-stone-800 font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to sign in</span>
              </button>
            </form>
          )}

          {mode === 'login' && (
            <div className="text-center space-y-1">
              <p className="text-[11px] text-stone-400">
                Staff accounts are created by the cafe admin under Staff Accounts.
              </p>
              <p className="text-[11px] text-stone-400">
                Customers scanning table QR codes do not require login.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
