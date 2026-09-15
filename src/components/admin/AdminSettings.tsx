import React, { useState, useRef } from 'react';
import { AdminUser, CafeInfo } from '../../types';
import { Save, ShieldCheck, Store, Percent, Phone, MapPin, Sparkles, Image as ImageIcon, Upload, KeyRound, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { staffService } from '../../services/staff';

// Keep uploaded cafe images reasonably small — they're fetched on every
// cafe-info poll across every device, so an unbounded upload would bloat
// that request for everyone, not just the admin who uploaded it.
const MAX_LOGO_FILE_BYTES = 500 * 1024;

interface AdminSettingsProps {
  cafe: CafeInfo;
  currentUser: AdminUser;
  onUpdateCafe: (updated: CafeInfo) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ cafe, currentUser, onUpdateCafe }) => {
  const [formData, setFormData] = useState<CafeInfo>(cafe);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // The signed-in admin's own password. Staff passwords are reset from the
  // Staff Accounts page; an admin login is only ever changed here, by its
  // owner, and only with the current password in hand.
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all three password fields.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from the current one.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await staffService.changePassword(currentUser.email, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Could not change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);

    if (!file.type.startsWith('image/')) {
      setLogoError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_LOGO_FILE_BYTES) {
      setLogoError(`Image is too large — please choose one under ${Math.round(MAX_LOGO_FILE_BYTES / 1024)}KB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, logo: reader.result as string }));
    };
    reader.onerror = () => setLogoError('Could not read that file. Please try again.');
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCafe({
      ...formData,
      taxPercent: Number.isNaN(formData.taxPercent) ? 0 : formData.taxPercent,
      serviceChargePercent: Number.isNaN(formData.serviceChargePercent) ? 0 : formData.serviceChargePercent,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-black text-stone-900 tracking-tight">Cafe Settings</h2>
        <p className="text-xs text-stone-500">
          Configure business details, GST tax slabs, and system preferences
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Settings saved successfully! Updated in live QR menus.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-5 text-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
          <Store className="w-4 h-4 text-amber-600" />
          <h3 className="font-bold text-stone-900 text-sm">General Profile</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Cafe Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Phone / Support Number
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
            Tagline / Subtitle
          </label>
          <input
            type="text"
            value={formData.tagline}
            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
            Physical Address
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Cafe Image / Logo */}
        <div>
          <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
            Cafe Image / Logo
          </label>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center overflow-hidden shrink-0">
              {formData.logo ? (
                <img src={formData.logo} alt="Cafe logo preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-6 h-6 text-stone-300" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="hidden"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-stone-900 hover:bg-black text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                </button>
                {formData.logo && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logo: '' })}
                    className="px-3 py-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 border border-stone-200 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                type="url"
                placeholder="...or paste an image URL"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 text-[11px]"
              />
              {logoError && <p className="text-[11px] text-rose-600 font-semibold">{logoError}</p>}
            </div>
          </div>
        </div>

        {/* Taxes & Charges */}
        <div className="pt-4 border-t border-stone-100">
          <div className="flex items-center gap-2 mb-3">
            <Percent className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-stone-900 text-sm">Taxation & Service Charge</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                GST Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={Number.isNaN(formData.taxPercent) ? '' : formData.taxPercent}
                onChange={(e) => setFormData({ ...formData, taxPercent: e.target.valueAsNumber })}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Applied to every customer order and printed table bill
              </span>
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Service Charge (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="15"
                value={Number.isNaN(formData.serviceChargePercent) ? '' : formData.serviceChargePercent}
                onChange={(e) => setFormData({ ...formData, serviceChargePercent: e.target.valueAsNumber })}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">Optional cafe service fee</span>
            </div>
          </div>
        </div>

        {/* Orders Toggle */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
          <div>
            <div className="font-bold text-stone-900">Accepting QR Orders</div>
            <div className="text-[11px] text-stone-500">
              When switched off, customers see a notice that the kitchen is closed.
            </div>
          </div>
          <input
            type="checkbox"
            checked={formData.isAcceptingOrders}
            onChange={(e) => setFormData({ ...formData, isAcceptingOrders: e.target.checked })}
            className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500"
          />
        </div>

        {/* Actions */}
        <div className="pt-5 border-t border-stone-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </form>

      {/* Admin Password */}
      <form
        onSubmit={handleChangePassword}
        className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-5 text-xs"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600" />
              Admin Password
            </h3>
            <p className="text-[11px] text-stone-500 mt-1">
              Change the password for your admin login, <span className="font-semibold text-stone-700">{currentUser.email}</span>.
              Kitchen and staff passwords are managed under Staff Accounts.
            </p>
          </div>
        </div>

        {passwordError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 font-semibold rounded-xl">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Password changed. Use the new password next time you sign in.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Current Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((v) => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              New Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-9 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-5 border-t border-stone-100 flex justify-end">
          <button
            type="submit"
            disabled={isChangingPassword}
            className="px-6 py-2.5 bg-stone-900 hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            <span>{isChangingPassword ? 'Updating...' : 'Change Password'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
