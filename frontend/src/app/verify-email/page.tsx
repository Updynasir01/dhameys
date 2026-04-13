'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authApi } from '../../lib/api';
import toast from 'react-hot-toast';

function VerifyEmailContent() {
  const params = useSearchParams();
  const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'err'>('loading');

  useEffect(() => {
    const token = params.get('token')?.trim();
    if (!token) {
      setState('missing');
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => {
        setState('ok');
        toast.success('Email verified. You can sign in.');
      })
      .catch(() => {
        setState('err');
        toast.error('Invalid or expired link');
      });
  }, [params]);

  if (state === 'loading') {
    return <p className="text-gray-600">Verifying your email…</p>;
  }
  if (state === 'missing') {
    return (
      <div className="space-y-2 text-center">
        <p className="text-gray-700">No verification token in the link.</p>
        <p className="text-sm text-gray-500">Open the link from your registration email, or sign in if your account is already active.</p>
      </div>
    );
  }
  if (state === 'ok') {
    return (
      <div className="space-y-4 text-center">
        <p className="text-gray-800 font-medium">Your email is verified.</p>
        <Link href="/login" className="inline-block bg-[#1a3570] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1e4080]">
          Go to sign in
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-2 text-center">
      <p className="text-gray-700">We could not verify this link.</p>
      <p className="text-sm text-gray-500">Request a new link from support or register again.</p>
      <Link href="/login" className="text-[#1a3570] text-sm font-semibold hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-[#1a3570] mb-6">
          <span className="text-yellow-400">✈</span>
          <span>Dhameys Airlines</span>
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mb-4">Email verification</h1>
        <Suspense fallback={<p className="text-gray-500">Loading…</p>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
