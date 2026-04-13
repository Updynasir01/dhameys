'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '../../lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
      toast.success('If an account exists for that email, you will receive reset instructions shortly.');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string; details?: { message?: string }[] } } };
      const details = ax?.response?.data?.details;
      const msg = Array.isArray(details)
        ? details.map((d) => d?.message).filter(Boolean).join('\n')
        : ax?.response?.data?.error || 'Something went wrong';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-[#1a3570] mb-8">
          <span className="text-yellow-400">✈</span>
          <span>Dhameys Airlines</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot password</h1>
        <p className="text-gray-500 text-sm mb-6">
          {sent
            ? 'Check your inbox for a link to reset your password. If it does not arrive within a few minutes, check your spam folder.'
            : 'Enter your account email and we will send you a link to choose a new password.'}
        </p>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1a3570] outline-none"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a3570] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#1e4080] transition disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        ) : (
          <Link
            href="/login/"
            className="inline-flex w-full justify-center bg-[#1a3570] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#1e4080] transition"
          >
            Back to sign in
          </Link>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login/" className="text-[#1a3570] font-semibold hover:underline">
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
