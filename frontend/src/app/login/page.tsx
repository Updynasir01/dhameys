'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuthStore();
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]  = useState(false);
  const [twoFaMode, setTwoFaMode] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [code, setCode]        = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const result = await login(email, password);
      if (result?.requiresTwoFa) { setTwoFaMode(true); setTempToken(result.tempToken || ''); }
      else { toast.success('Welcome back!'); router.push('/'); }
    } catch (err: any) {
      const data = err?.response?.data;
      const details = Array.isArray(data?.details) ? data.details : null;
      const msg = details?.length
        ? details.map((d: any) => d?.message).filter(Boolean).join('\n')
        : (data?.error || 'Login failed');
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const { verify2FA } = useAuthStore.getState();
      await verify2FA(tempToken, code);
      toast.success('Welcome back!'); router.push('/');
    } catch { toast.error('Invalid 2FA code'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-[#1a3570] mb-8">
          <span className="text-yellow-400">✈</span><span>Dhameys Airlines</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{twoFaMode ? 'Two-Factor Authentication' : 'Welcome back'}</h1>
        <p className="text-gray-500 text-sm mb-6">{twoFaMode ? 'Enter the 6-digit code from your authenticator app.' : 'Sign in to your account to manage bookings and access your profile.'}</p>

        {!twoFaMode ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1a3570] outline-none" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1a3570] outline-none" placeholder="••••••••" />
            </div>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-[#1a3570] hover:underline">Forgot password?</Link>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#1a3570] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#1e4080] transition disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handle2FA} className="space-y-4">
            <input value={code} onChange={e => setCode(e.target.value)} maxLength={6} autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-4 text-3xl text-center tracking-widest font-mono focus:ring-2 focus:ring-[#1a3570] outline-none" placeholder="000000" />
            <button type="submit" disabled={loading || code.length !== 6}
              className="w-full bg-[#1a3570] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#1e4080] disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        )}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account? <Link href="/register" className="text-[#1a3570] font-semibold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
