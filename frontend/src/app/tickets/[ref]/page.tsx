'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import { ticketApi } from '../../../lib/api';
import { Download, Loader2, Plane } from 'lucide-react';
import toast from 'react-hot-toast';

type TicketRow = {
  _id: string;
  passengerName?: string;
  flightNumber?: string;
  originIata?: string;
  destIata?: string;
  departureTime?: string;
  ticketNumber?: string;
  pnrCode?: string;
  seatCode?: string;
  checkinStatus?: string;
};

export default function TicketsForBookingPage() {
  const params = useParams();
  const raw = typeof params.ref === 'string' ? params.ref : '';
  const ref = decodeURIComponent(raw).trim().toUpperCase();

  const { data: tickets, isLoading, isError } = useQuery({
    queryKey: ['tickets', ref],
    queryFn: () => ticketApi.getForBooking(ref).then((r) => r.data.data as TicketRow[]),
    enabled: !!ref,
    retry: false,
  });

  async function downloadPdf(ticketId: string) {
    try {
      const res = await ticketApi.getPDF(ticketId);
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${ticketId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('PDF not available yet. It is generated after payment confirms.');
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-center gap-2 mb-2">
          <Plane className="w-7 h-7 text-[#1a3570]" />
          <h1 className="text-2xl font-bold text-gray-900">E-tickets</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Booking <span className="font-mono font-semibold text-gray-800">{ref || '—'}</span>
          {' · '}
          <Link href="/my-bookings" className="text-[#1a3570] font-medium hover:underline">
            My bookings
          </Link>
        </p>

        {!ref ? (
          <p className="text-gray-600">Invalid link.</p>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mr-2" /> Loading tickets…
          </div>
        ) : isError ? (
          <div className="card p-8 text-center">
            <p className="text-gray-800 font-medium mb-2">Could not load tickets</p>
            <p className="text-sm text-gray-500 mb-4">
              The booking may not exist, or you need to sign in with the account that made this booking.
            </p>
            <Link href="/login" className="btn-primary inline-block">
              Sign in
            </Link>
          </div>
        ) : !tickets?.length ? (
          <div className="card p-8 text-center text-gray-600">
            <p>No e-tickets yet. They are usually issued after your booking is confirmed and paid.</p>
            <Link href={`/booking/manage/${encodeURIComponent(ref)}`} className="text-[#1a3570] font-medium hover:underline mt-4 inline-block">
              Manage booking
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {tickets.map((t) => (
              <li key={t._id} className="card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{t.passengerName || 'Passenger'}</p>
                  <p className="text-sm text-gray-600">
                    {t.flightNumber} · {t.originIata} → {t.destIata}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t.departureTime ? new Date(t.departureTime).toLocaleString() : ''}
                    {t.seatCode ? ` · Seat ${t.seatCode}` : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    {t.ticketNumber}
                    {t.pnrCode ? ` · PNR ${t.pnrCode}` : ''}
                  </p>
                  {t.checkinStatus && t.checkinStatus !== 'not_checked_in' && (
                    <p className="text-xs text-green-700 mt-1 capitalize">Check-in: {t.checkinStatus.replace('_', ' ')}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => downloadPdf(t._id)}
                  className="btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
