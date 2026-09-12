import React, { useState } from 'react';
import { AdminUser, CafeInfo } from '../../types';
import { staffService } from '../../services/staff';
import { Lock, Mail, Loader2 } from 'lucide-react';

interface AdminLoginProps {
  cafe: CafeInfo;
  onLoginSuccess: (account: AdminUser) => void;
}

// Every sign-in is verified by the server against the admin_users table —
// there is no built-in or demo account. Which portal the person lands in
// (admin console vs kitchen display) is decided by the role stored on their
// account, not by anything chosen on this screen.
export const AdminLogin: React.FC<AdminLoginProps> = ({ cafe, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const account = await staffService.login(trimmedEmail, password);
      onLoginSuccess(account);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-stone-900 p-8 text-center text-white relative">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center mx-auto mb-3 font-black shadow-md">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black tracking-tight">{cafe.name} Staff Portal</h2>
          <p className="text-xs text-stone-400 mt-1">
            Protected administrative & kitchen management console
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl">
              {errorMsg}
            </div>
          )}

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
                  className="w-full pl-9 pr-3 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
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

          <div className="text-center space-y-1">
            <p className="text-[11px] text-stone-400">
              Staff accounts are created by the cafe admin under Staff Accounts.
            </p>
            <p className="text-[11px] text-stone-400">
              Customers scanning table QR codes do not require login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
