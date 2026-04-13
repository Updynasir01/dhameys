'use client';

import { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { ticketApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { Loader2, Plane, CheckCircle2 } from 'lucide-react';

type TicketRow = {
  _id: string;
  passengerId?: string;
  passengerName?: string;
  flightNumber?: string;
  originIata?: string;
  destIata?: string;
  departureTime?: string;
  seatCode?: string;
  checkinStatus?: string;
};

export default function CheckInPage() {
  const [bookingRef, setBookingRef] = useState('');
  const [tickets, setTickets] = useState<TicketRow[] | null>(null);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const ref = bookingRef.trim().toUpperCase();
    if (!ref) {
      toast.error('Enter a booking reference');
      return;
    }
    setLoadingLookup(true);
    setTickets(null);
    try {
      const { data } = await ticketApi.getForBooking(ref);
      const list = (data?.data ?? []) as TicketRow[];
      if (!list.length) {
        toast.error('No tickets found for this reference');
        setTickets([]);
        return;
      }
      setTickets(list);
      setBookingRef(ref);
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { error?: string } } };
      if (ax.response?.status === 404) {
        toast.error('Booking not found. Check the reference or sign in if this booking is on your account.');
      } else {
        toast.error(ax.response?.data?.error || 'Could not load booking');
      }
      setTickets(null);
    } finally {
      setLoadingLookup(false);
    }
  }

  async function handleCheckIn(ticket: TicketRow) {
    const ref = bookingRef.trim().toUpperCase();
    const pid = ticket.passengerId;
    if (!pid) {
      toast.error('Missing passenger id for this ticket');
      return;
    }
    setCheckingId(ticket._id);
    try {
      await ticketApi.checkIn(ref, String(pid));
      toast.success('Checked in successfully');
      const { data } = await ticketApi.getForBooking(ref);
      setTickets((data?.data ?? []) as TicketRow[]);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error || 'Check-in failed');
    } finally {
      setCheckingId(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-center gap-3 mb-2">
          <Plane className="w-8 h-8 text-[#1a3570]" />
          <h1 className="text-2xl font-bold text-gray-900">Online check-in</h1>
        </div>
        <p className="text-sm text-gray-500 mb-8">
          Enter your booking reference (e.g. DH-ABC123). Check-in opens{' '}
          <strong>48 hours</strong> before departure and closes <strong>1 hour</strong> before departure.
        </p>

        <form onSubmit={handleLookup} className="card p-5 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Booking reference</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value)}
              placeholder="e.g. DH-XXXXXX"
              className="input-field flex-1 uppercase"
              autoComplete="off"
            />
            <button type="submit" disabled={loadingLookup} className="btn-primary whitespace-nowrap px-6">
              {loadingLookup ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Finding…
                </>
              ) : (
                'Find booking'
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            If you are signed in, only bookings on your account can be loaded. Otherwise you can look up by reference only.
          </p>
        </form>

        {tickets && tickets.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Passengers & flights</h2>
            {tickets.map((t) => {
              const done = t.checkinStatus === 'checked_in' || t.checkinStatus === 'boarded';
              return (
                <div key={t._id} className="card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{t.passengerName || 'Passenger'}</p>
                    <p className="text-sm text-gray-600">
                      {t.flightNumber} · {t.originIata} → {t.destIata}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t.departureTime ? new Date(t.departureTime).toLocaleString() : ''}
                      {t.seatCode ? ` · Seat ${t.seatCode}` : ''}
                    </p>
                    {done && (
                      <p className="text-sm text-green-600 font-medium mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Checked in
                      </p>
                    )}
                  </div>
                  {!done && (
                    <button
                      type="button"
                      onClick={() => handleCheckIn(t)}
                      disabled={checkingId === t._id}
                      className="btn-primary px-5 py-2.5 text-sm shrink-0"
                    >
                      {checkingId === t._id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                          Checking in…
                        </>
                      ) : (
                        'Check in'
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tickets && tickets.length === 0 && (
          <p className="text-center text-gray-500 py-8">No tickets for this reference.</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
