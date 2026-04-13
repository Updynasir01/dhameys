'use client';
// src/app/admin/page.tsx
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { useRouter }    from 'next/navigation';
import { useEffect }    from 'react';
import { adminApi }     from '../../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Plane, Users, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, XCircle,
} from 'lucide-react';
import Link from 'next/link';

type RecentBookingRow = {
  _id?: string;
  id?: string;
  bookingRef?: string;
  booking_ref?: string;
  contactEmail?: string;
  user?: { email?: string } | null;
  flights?: Array<{ originIata?: string; destIata?: string; departureTime?: string }>;
  passengers?: Array<{ firstName?: string; lastName?: string }>;
  totalAmount?: number;
  total_amount?: number;
  status?: string;
};

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string;
}) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (!['admin','superadmin'].includes(user?.role || '')) router.replace('/');
  }, [isAuthenticated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn:  () => adminApi.getDashboard().then(r => r.data.data),
    enabled:  isAuthenticated,
    refetchInterval: 60000,
  });

  const { data: revenueData } = useQuery({
    queryKey: ['admin-revenue', '30d'],
    queryFn:  () => adminApi.getRevenue({ from: new Date(Date.now()-30*86400000).toISOString().split('T')[0], groupBy: 'day' }).then(r => r.data.data),
    enabled:  isAuthenticated,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading dashboard…</p>
      </div>
    </div>
  );

  const s = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.firstName}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/flights" className="btn-secondary text-sm py-2">Manage Flights</Link>
          <Link href="/admin/bookings" className="btn-primary text-sm py-2">All Bookings</Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Revenue"
          value={`$${Number(s?.revenue?.total || 0).toLocaleString()}`}
          sub={`$${Number(s?.revenue?.last_30_days || 0).toLocaleString()} last 30d`}
          icon={<DollarSign className="w-5 h-5 text-green-700" />}
          color="bg-green-100"
        />
        <StatCard
          label="Total Bookings"
          value={Number(s?.bookings?.total || 0).toLocaleString()}
          sub={`${s?.bookings?.last_7_days || 0} this week`}
          icon={<Plane className="w-5 h-5 text-brand-700" />}
          color="bg-brand-100"
        />
        <StatCard
          label="Customers"
          value={Number(s?.users?.total || 0).toLocaleString()}
          sub={`${s?.users?.new_last_30_days || 0} new this month`}
          icon={<Users className="w-5 h-5 text-purple-700" />}
          color="bg-purple-100"
        />
        <StatCard
          label="Upcoming Flights"
          value={Number(s?.flights?.scheduled || 0).toLocaleString()}
          sub={`${s?.flights?.delayed || 0} delayed · ${s?.flights?.cancelled || 0} cancelled`}
          icon={<TrendingUp className="w-5 h-5 text-amber-700" />}
          color="bg-amber-100"
        />
      </div>

      {/* Booking status row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Confirmed',   value: s?.bookings?.confirmed,  icon: <CheckCircle className="w-4 h-4" />, cls: 'text-green-600 bg-green-50' },
          { label: 'Pending',     value: s?.bookings?.pending,    icon: <Clock        className="w-4 h-4" />, cls: 'text-amber-600 bg-amber-50' },
          { label: 'Cancelled',   value: s?.bookings?.cancelled,  icon: <XCircle      className="w-4 h-4" />, cls: 'text-red-600 bg-red-50' },
          { label: 'This Month',  value: s?.bookings?.last_30_days, icon: <TrendingUp className="w-4 h-4" />, cls: 'text-brand-600 bg-brand-50' },
        ].map(({ label, value, icon, cls }) => (
          <div key={label} className={`rounded-xl p-4 flex items-center gap-3 ${cls}`}>
            {icon}
            <div>
              <div className="font-bold text-lg leading-none">{value || 0}</div>
              <div className="text-xs mt-0.5 opacity-75">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Revenue — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={(revenueData || []).map((r: Record<string, unknown>) => ({
              date:    new Date(r.period as string).toLocaleDateString('en-GB', { day:'2-digit', month:'short' }),
              revenue: Number(r.revenue || 0),
              bookings: Number(r.bookings || 0),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#2e7dfa" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top routes */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top Routes (30d)</h2>
          <div className="space-y-3">
            {(s?.topRoutes || []).slice(0, 7).map((r: Record<string, string | number>, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {r.origin} → {r.destination}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-gray-700">{r.bookings} bkgs</div>
                  <div className="text-xs text-gray-400">${Number(r.revenue).toFixed(0)}</div>
                </div>
              </div>
            ))}
            {!s?.topRoutes?.length && <p className="text-sm text-gray-400">No data yet</p>}
          </div>
        </div>
      </div>

      {/* Recent bookings table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
          <Link href="/admin/bookings" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                {['Ref', 'Passenger', 'Route', 'Departure', 'Total', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(s?.recentBookings || []).map((raw: RecentBookingRow) => {
                const ref = raw.bookingRef ?? raw.booking_ref ?? '';
                const userEmail =
                  (typeof raw.user === 'object' && raw.user?.email) || raw.contactEmail || '';
                const pax =
                  Array.isArray(raw.passengers) && raw.passengers[0]
                    ? [raw.passengers[0].firstName, raw.passengers[0].lastName].filter(Boolean).join(' ').trim()
                    : '';
                const passengerCell = pax || userEmail || '—';
                const seg = Array.isArray(raw.flights) && raw.flights[0] ? raw.flights[0] : null;
                const origin = seg?.originIata ?? '';
                const destination = seg?.destIata ?? '';
                const firstDep = seg?.departureTime;
                const total = raw.totalAmount ?? raw.total_amount ?? 0;
                const st = String(raw.status ?? '');
                return (
                <tr key={String(raw._id ?? raw.id ?? ref)} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-brand-700">{ref || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">{passengerCell}</td>
                  <td className="px-4 py-3">
                    <span className="text-gray-900 font-medium">{origin || '—'}</span>
                    <span className="text-gray-400 mx-1">→</span>
                    <span className="text-gray-900 font-medium">{destination || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {firstDep ? new Date(firstDep).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">${Number(total).toFixed(0)}</td>
                  <td className="px-4 py-3">
                    <span className={{
                      confirmed: 'badge-green', pending: 'badge-amber',
                      cancelled: 'badge-red', completed: 'badge-gray',
                      refunded: 'badge-gray', partially_refunded: 'badge-gray',
                    }[st] || 'badge-gray'}>
                      {st}
                    </span>
                  </td>
                </tr>
                );
              })}
              {!s?.recentBookings?.length && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No bookings yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
