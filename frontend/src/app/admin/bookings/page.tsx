'use client';
// src/app/admin/bookings/page.tsx
import { useState } from 'react';

type AdminBookingRow = {
  _id?: string;
  id?: string;
  bookingRef?: string;
  contactEmail?: string;
  user?: { email?: string } | string | null;
  flights?: Array<{ originIata?: string; destIata?: string }>;
  passengers?: unknown[];
  totalAmount?: number;
  status?: string;
  createdAt?: string;
};
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../lib/api';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function AdminBookingsPage() {
  const [filters, setFilters] = useState({ status: '', search: '', page: 1 });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', filters],
    queryFn:  () =>
      adminApi.listBookings({ ...filters, limit: 20 }).then(r => r.data.data),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        <Link href="/admin" className="hover:text-brand-600">Dashboard</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Bookings</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Bookings</h1>

      <div className="card p-4 mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
            className="input-field pl-9 text-sm py-2" placeholder="Search ref or email…" />
        </div>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
          className="input-field w-44 text-sm py-2">
          <option value="">All statuses</option>
          {['pending','confirmed','cancelled','refunded','completed'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
              <tr>
                {['Ref', 'Customer', 'Route', 'Pax', 'Total', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && Array.from({length:8}).map((_,i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-5 bg-gray-100 rounded animate-pulse"/></td></tr>
              ))}
              {!isLoading && !data?.bookings?.length && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No bookings found</td></tr>
              )}
              {(data?.bookings || []).map((b: AdminBookingRow) => {
                const userEmail =
                  (typeof b.user === 'object' && b.user && 'email' in b.user && (b.user as { email?: string }).email) ||
                  b.contactEmail ||
                  '';
                const routes =
                  Array.isArray(b.flights) && b.flights.length
                    ? b.flights.map(f => `${f.originIata ?? ''}→${f.destIata ?? ''}`).join(' · ')
                    : '';
                const ref = b.bookingRef ?? (b as { booking_ref?: string }).booking_ref ?? '';
                const created = b.createdAt ?? (b as { created_at?: string }).created_at;
                const pax = Array.isArray(b.passengers) ? b.passengers.length : (b as { passenger_count?: number }).passenger_count ?? 0;
                const total = b.totalAmount ?? (b as { total_amount?: number }).total_amount ?? 0;
                return (
                <tr key={String(b._id ?? b.id)} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-brand-700">{ref}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{userEmail}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{routes || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{pax}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">${Number(total).toFixed(0)}</td>
                  <td className="px-4 py-3">
                    <span className={{
                      confirmed:'badge-green', pending:'badge-amber',
                      cancelled:'badge-red', refunded:'badge-gray', completed:'badge-gray',
                    }[String(b.status)] || 'badge-gray'}>{String(b.status)}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {created ? new Date(created).toLocaleDateString() : '-'}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
        {data?.total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>{data.total} total bookings</span>
            <div className="flex gap-2">
              <button disabled={filters.page <= 1} onClick={() => setFilters(f => ({...f, page: f.page-1}))} className="btn-ghost py-1 px-3 disabled:opacity-40">← Prev</button>
              <span>Page {filters.page} of {Math.ceil(data.total / 20)}</span>
              <button disabled={filters.page >= Math.ceil(data.total / 20)} onClick={() => setFilters(f => ({...f, page: f.page+1}))} className="btn-ghost py-1 px-3 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
