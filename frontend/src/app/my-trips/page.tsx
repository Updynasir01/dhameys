'use client';
// src/app/my-trips/page.tsx — also served at /my-bookings
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { userApi } from '../../lib/api';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Plane, Download, ChevronRight } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'badge-green', pending: 'badge-amber',
  cancelled: 'badge-red', completed: 'badge-gray', refunded: 'badge-gray',
};

function bookingRef(b: Record<string, unknown>) {
  return String(b.bookingRef ?? b.booking_ref ?? '');
}

export default function MyTripsPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname() || '/my-trips';
  const isBookingsUrl = pathname.includes('my-bookings');
  const pageTitle = isBookingsUrl ? 'My Bookings' : 'My Trips';

  useEffect(() => {
    if (!isAuthenticated) router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
  }, [isAuthenticated, router, pathname]);

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn:  () => userApi.getBookings().then(r => r.data.data),
    enabled:  isAuthenticated,
  });

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{pageTitle}</h1>

      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card p-5 h-24 animate-pulse bg-gray-100" />)}
        </div>
      )}

      {!isLoading && !data?.bookings?.length && (
        <div className="card p-12 text-center">
          <Plane className="w-12 h-12 mx-auto mb-4 text-gray-200" />
          <h3 className="font-semibold text-gray-700 mb-2">No trips yet</h3>
          <p className="text-sm text-gray-500 mb-4">Your booked flights will appear here.</p>
          <Link href="/" className="btn-primary inline-flex">Search Flights</Link>
        </div>
      )}

      <div className="space-y-3">
        {data?.bookings?.map((b: Record<string, unknown>) => {
          const ref = bookingRef(b);
          const seg = (b.flights as { originIata?: string; destIata?: string; departureTime?: string }[] | undefined)?.[0];
          const total = Number(b.totalAmount ?? b.total_amount ?? 0);
          const cur = String(b.currency ?? 'USD');
          const email = String(b.contactEmail ?? b.contact_email ?? '');
          return (
          <div key={String(b._id ?? b.id)} className="card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-bold text-brand-700 text-lg">{ref}</span>
                  <span className={STATUS_COLORS[b.status as string] || 'badge-gray'}>
                    {(b.status as string)?.replace('_',' ')}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {seg?.originIata && seg?.destIata && (
                    <span>
                      {seg.originIata} → {seg.destIata}
                      {seg.departureTime && (
                        <> · {new Date(seg.departureTime).toLocaleDateString()}</>
                      )}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {cur} {total.toFixed(2)}{email ? ` · ${email}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/tickets/${ref}/`}
                  className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium">
                  <Download className="w-4 h-4" /> Tickets
                </Link>
                <Link href={`/booking/manage/${ref}`}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                  Manage <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        );
        })}
      </div>
      </div>
      <Footer />
    </div>
  );
}
