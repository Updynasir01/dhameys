'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '../../lib/api';
import toast from 'react-hot-toast';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid or missing reset link. Request a new one from the forgot password page.');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password updated. You can sign in now.');
      router.push('/login/');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string; details?: { message?: string }[] } } };
      const details = ax?.response?.data?.details;
      const msg = Array.isArray(details)
        ? details.map((d) => d?.message).filter(Boolean).join('\n')
        : ax?.response?.data?.error || 'Could not reset password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Set a new password</h1>
      <p className="text-gray-500 text-sm mb-6">
        Choose a strong password. At least 8 characters, one uppercase letter, and one number.
      </p>

      {!token ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
          This link is invalid or incomplete. Open the link from your email, or{' '}
          <Link href="/forgot-password/" className="font-semibold text-[#1a3570] underline">
            request a new reset email
          </Link>
          .
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1a3570] outline-none"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1a3570] outline-none"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !token}
          className="w-full bg-[#1a3570] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#1e4080] transition disabled:opacity-50"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        <Link href="/login/" className="text-[#1a3570] font-semibold hover:underline">
          ← Back to login
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-[#1a3570] mb-8">
          <span className="text-yellow-400">✈</span>
          <span>Dhameys Airlines</span>
        </Link>
        <Suspense
          fallback={
            <p className="text-gray-500 text-sm">Loading…</p>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
