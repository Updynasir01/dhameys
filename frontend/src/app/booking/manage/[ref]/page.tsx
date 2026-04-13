'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import Navbar from '../../../../components/layout/Navbar';
import Footer from '../../../../components/layout/Footer';
import Link from 'next/link';
import { bookingApi } from '../../../../lib/api';
import toast from 'react-hot-toast';
import { Loader2, Plane, XCircle } from 'lucide-react';

export default function ManageBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const rawRef = typeof params.ref === 'string' ? params.ref : '';
  const bookingRef = decodeURIComponent(rawRef).trim().toUpperCase();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: booking, isLoading, isError, error } = useQuery({
    queryKey: ['booking', bookingRef],
    queryFn: () => bookingApi.get(bookingRef).then((r) => r.data.data),
    enabled: !!bookingRef,
    retry: false,
  });

  const cancelMutation = useMutation({
    mutationFn: () => bookingApi.cancel(bookingRef, cancelReason || undefined),
    onSuccess: () => {
      toast.success('Booking cancelled');
      setCancelOpen(false);
      setCancelReason('');
      qc.invalidateQueries({ queryKey: ['booking', bookingRef] });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error || 'Could not cancel');
    },
  });

  useEffect(() => {
    if (!bookingRef) router.replace('/manage-booking');
  }, [bookingRef, router]);

  const errMsg = (error as { response?: { data?: { error?: string }; status?: number } })?.response?.data?.error;
  const notFound = isError && (error as { response?: { status?: number } })?.response?.status === 404;

  const canCancel =
    booking &&
    ['pending', 'confirmed'].includes(String(booking.status)) &&
    !['cancelled', 'refunded'].includes(String(booking.status));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Booking details</h1>
          <Link href="/manage-booking" className="text-sm text-[#1a3570] font-medium hover:underline">
            New search
          </Link>
        </div>

        {!bookingRef ? null : isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mr-2" /> Loading…
          </div>
        ) : notFound ? (
          <div className="card p-8 text-center">
            <p className="text-gray-800 font-medium mb-2">Booking not found</p>
            <p className="text-sm text-gray-500 mb-4">
              Check the reference, or sign in with the account used for this booking and try again.
            </p>
            <Link href="/manage-booking" className="btn-primary inline-block">
              Try again
            </Link>
          </div>
        ) : isError ? (
          <div className="card p-8 text-center text-red-600">{errMsg || 'Could not load booking'}</div>
        ) : booking ? (
          <>
            <div className="card p-6 mb-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Reference</p>
                  <p className="text-xl font-bold text-[#1a3570]">{booking.bookingRef}</p>
                  <p className="text-sm text-gray-600 mt-2 capitalize">
                    Status: <span className="font-semibold">{String(booking.status).replace('_', ' ')}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-bold text-gray-900">
                    {booking.currency || 'USD'} {Number(booking.totalAmount ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
                <p>{booking.contactEmail}</p>
                {booking.contactPhone ? <p>{booking.contactPhone}</p> : null}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Plane className="w-5 h-5 text-[#1a3570]" />
                Flights
              </h2>
              <ul className="space-y-3">
                {(booking.flights || []).map((seg: Record<string, unknown>, i: number) => {
                  const f = seg.flight as Record<string, unknown> | undefined;
                  const dep = seg.departureTime || f?.departureTime;
                  return (
                    <li key={i} className="card p-4">
                      <p className="font-semibold text-gray-900">
                        {String(seg.originIata ?? f?.originIata ?? '')} → {String(seg.destIata ?? f?.destIata ?? '')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {String(seg.flightNumber ?? f?.flightNumber ?? '')}
                        {dep ? ` · ${new Date(String(dep)).toLocaleString()}` : ''}
                      </p>
                      <p className="text-xs text-gray-500 capitalize mt-1">
                        {(seg.cabinClass as string)?.replace('_', ' ') || 'economy'}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Passengers</h2>
              <ul className="space-y-2">
                {(booking.passengers || []).map((p: Record<string, unknown>, i: number) => (
                  <li key={i} className="card px-4 py-3 text-sm">
                    <span className="font-medium">
                      {String(p.firstName)} {String(p.lastName)}
                    </span>
                    {p.seatCode ? (
                      <span className="text-gray-500 ml-2">Seat {String(p.seatCode)}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={`/check-in`} className="btn-secondary inline-flex items-center justify-center px-5 py-2.5 text-sm">
                Go to check-in
              </Link>
              {canCancel && (
                <button
                  type="button"
                  onClick={() => setCancelOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl border border-red-200 text-red-700 bg-white hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel booking
                </button>
              )}
            </div>

            {cancelOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel this booking?</h3>
                  <p className="text-sm text-gray-500 mb-4">This cannot be undone. Add an optional reason below.</p>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason (optional)"
                    className="input-field w-full min-h-[80px] mb-4"
                  />
                  <div className="flex gap-3 justify-end">
                    <button type="button" className="btn-secondary px-4 py-2" onClick={() => setCancelOpen(false)}>
                      Keep booking
                    </button>
                    <button
                      type="button"
                      disabled={cancelMutation.isPending}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                      onClick={() => cancelMutation.mutate()}
                    >
                      {cancelMutation.isPending ? 'Cancelling…' : 'Confirm cancel'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
