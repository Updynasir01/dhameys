'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { useAuthStore } from '../../store/auth.store';
import { userApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { Loader2, Lock } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { isAuthenticated, updateUser } = useAuthStore();

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login?redirect=/profile');
  }, [isAuthenticated, router]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userApi.getProfile().then(r => r.data.data),
    enabled: isAuthenticated,
  });

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => userApi.updateProfile(body),
    onSuccess: (res) => {
      toast.success('Profile saved');
      const u = res.data?.data;
      if (u) {
        updateUser({
          firstName: u.firstName,
          lastName: u.lastName,
          loyaltyPoints: u.loyaltyPoints,
          loyaltyTier: u.loyaltyTier,
        });
      }
      qc.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) =>
      toast.error(err?.response?.data?.error || 'Could not save profile'),
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      userApi.changePassword({ currentPassword: pw.current, newPassword: pw.next }),
    onSuccess: () => {
      toast.success('Password updated');
      setPw({ current: '', next: '', confirm: '' });
    },
    onError: (err: { response?: { data?: { error?: string } } }) =>
      toast.error(err?.response?.data?.error || 'Could not change password'),
  });

  function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      firstName: fd.get('firstName'),
      lastName: fd.get('lastName'),
      phone: fd.get('phone') || undefined,
      preferredCurrency: fd.get('preferredCurrency'),
      preferredCabin: fd.get('preferredCabin'),
      marketingConsent: fd.get('marketingConsent') === 'on',
    });
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.next !== pw.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (pw.next.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    passwordMutation.mutate();
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-sm text-gray-500 mb-8">Manage your account details and preferences.</p>

        {isLoading || !profile ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mr-2" /> Loading profile…
          </div>
        ) : (
          <>
            <form onSubmit={handleProfileSubmit} className="card p-6 space-y-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold">
                  {(profile.firstName?.[0] || '?')}{(profile.lastName?.[0] || '')}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {profile.firstName} {profile.lastName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{profile.role} · {profile.loyaltyTier} tier</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input
                  name="email"
                  defaultValue={profile.email}
                  disabled
                  className="input-field bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">First name</label>
                  <input
                    name="firstName"
                    required
                    defaultValue={profile.firstName}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Last name</label>
                  <input
                    name="lastName"
                    required
                    defaultValue={profile.lastName}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={profile.phone || ''}
                  className="input-field"
                  placeholder="Optional"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Preferred currency</label>
                  <select
                    name="preferredCurrency"
                    defaultValue={profile.preferredCurrency || 'USD'}
                    className="input-field"
                  >
                    {['USD', 'EUR', 'GBP', 'AED', 'SAR'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Preferred cabin</label>
                  <select
                    name="preferredCabin"
                    defaultValue={profile.preferredCabin || 'economy'}
                    className="input-field"
                  >
                    <option value="economy">Economy</option>
                    <option value="premium_economy">Premium Economy</option>
                    <option value="business">Business</option>
                    <option value="first">First</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="marketingConsent"
                  defaultChecked={!!profile.marketingConsent}
                  className="rounded border-gray-300 text-brand-700 focus:ring-brand-500"
                />
                Email me deals and promotions
              </label>

              <div className="pt-2 flex items-center gap-3">
                <button type="submit" className="btn-primary" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving…' : 'Save changes'}
                </button>
                <span className="text-sm text-gray-500">
                  {profile.loyaltyPoints != null ? `${profile.loyaltyPoints.toLocaleString()} loyalty points` : null}
                </span>
              </div>
            </form>

            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-brand-700" />
                <h2 className="font-semibold text-gray-900">Change password</h2>
              </div>
              <form onSubmit={handlePasswordSubmit} className="space-y-3 max-w-md">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Current password</label>
                  <input
                    type="password"
                    value={pw.current}
                    onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                    className="input-field"
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">New password</label>
                  <input
                    type="password"
                    value={pw.next}
                    onChange={e => setPw(p => ({ ...p, next: e.target.value }))}
                    className="input-field"
                    autoComplete="new-password"
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Confirm new password</label>
                  <input
                    type="password"
                    value={pw.confirm}
                    onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                    className="input-field"
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-secondary"
                  disabled={passwordMutation.isPending || !pw.current || !pw.next}
                >
                  {passwordMutation.isPending ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
