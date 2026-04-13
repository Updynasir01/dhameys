'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { useAuthStore } from '../../store/auth.store';
import { userApi } from '../../lib/api';
import { Loader2, Star } from 'lucide-react';
import Link from 'next/link';

const TIERS = [
  { id: 'bronze', label: 'Bronze', min: 0, color: 'from-amber-700 to-amber-900' },
  { id: 'silver', label: 'Silver', min: 10_000, color: 'from-slate-400 to-slate-600' },
  { id: 'gold', label: 'Gold', min: 50_000, color: 'from-yellow-500 to-amber-600' },
  { id: 'platinum', label: 'Platinum', min: 150_000, color: 'from-violet-500 to-purple-700' },
] as const;

type Tx = {
  _id?: string;
  type?: string;
  points?: number;
  balanceAfter?: number;
  description?: string;
  createdAt?: string;
};

export default function LoyaltyPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login?redirect=/loyalty');
  }, [isAuthenticated, router]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-loyalty'],
    queryFn: () => userApi.getLoyalty().then((r) => r.data.data as {
      loyaltyPoints: number;
      loyaltyTier: string;
      transactions: Tx[];
    }),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  const points = data?.loyaltyPoints ?? 0;
  const tier = (data?.loyaltyTier || 'bronze').toLowerCase();
  const tierInfo = TIERS.find((t) => t.id === tier) ?? TIERS[0];
  const nextTier = TIERS.find((t) => t.min > points);
  const progressToNext = nextTier
    ? Math.min(100, Math.round(((points - tierInfo.min) / (nextTier.min - tierInfo.min)) * 100))
    : 100;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Star className="w-7 h-7 text-yellow-500 fill-yellow-400" />
          Loyalty & rewards
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Earn points on every booking. Tiers update as your balance grows.
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mr-2" /> Loading…
          </div>
        ) : isError ? (
          <div className="card p-8 text-center text-gray-600">
            Could not load loyalty data.{' '}
            <Link href="/profile" className="text-[#1a3570] font-medium hover:underline">
              Try profile
            </Link>
          </div>
        ) : (
          <>
            <div
              className={`rounded-2xl bg-gradient-to-br ${tierInfo.color} text-white p-6 sm:p-8 shadow-lg mb-8`}
            >
              <p className="text-white/80 text-sm font-medium uppercase tracking-wide">Current tier</p>
              <p className="text-3xl font-bold capitalize mt-1">{tierInfo.label}</p>
              <p className="text-2xl font-semibold mt-4">{points.toLocaleString()} points</p>
              {nextTier ? (
                <>
                  <div className="mt-4 h-2 rounded-full bg-white/25 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white transition-all"
                      style={{ width: `${progressToNext}%` }}
                    />
                  </div>
                  <p className="text-sm text-white/90 mt-2">
                    {(nextTier.min - points).toLocaleString()} points to {nextTier.label}
                  </p>
                </>
              ) : (
                <p className="text-sm text-white/90 mt-4">You have reached the highest tier.</p>
              )}
            </div>

            <div className="card overflow-hidden">
              <h2 className="text-lg font-semibold text-gray-900 px-5 py-4 border-b border-gray-100">
                Recent activity
              </h2>
              {!data?.transactions?.length ? (
                <p className="px-5 py-10 text-center text-gray-500 text-sm">
                  No transactions yet. Book a flight to start earning points.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {data.transactions.map((tx) => (
                    <li key={tx._id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div>
                        <span className="font-medium text-gray-900 capitalize">
                          {tx.type?.replace('_', ' ') ?? 'Activity'}
                        </span>
                        {tx.description ? (
                          <p className="text-sm text-gray-500">{tx.description}</p>
                        ) : null}
                        {tx.createdAt ? (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(tx.createdAt).toLocaleString()}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={
                            (tx.points ?? 0) >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'
                          }
                        >
                          {(tx.points ?? 0) >= 0 ? '+' : ''}
                          {(tx.points ?? 0).toLocaleString()} pts
                        </span>
                        {tx.balanceAfter != null ? (
                          <p className="text-xs text-gray-400">Balance {tx.balanceAfter.toLocaleString()}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-6 text-center">
              Tiers: Bronze &lt; 10k · Silver 10k+ · Gold 50k+ · Platinum 150k+ points.
            </p>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
