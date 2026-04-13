'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function ManageBookingPage() {
  const router = useRouter();
  const [ref, setRef] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const r = ref.trim().toUpperCase();
    if (!r) return;
    router.push(`/booking/manage/${encodeURIComponent(r)}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage booking</h1>
        <p className="text-sm text-gray-500 mb-8">
          Look up your reservation with your booking reference. You can view details or request a cancellation.
        </p>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label htmlFor="ref" className="block text-sm font-medium text-gray-700 mb-1">
              Booking reference
            </label>
            <input
              id="ref"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. DH-ABC123"
              className="input-field w-full uppercase"
              autoComplete="off"
            />
          </div>
          <button type="submit" disabled={!ref.trim()} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            <Search className="w-4 h-4" />
            Find booking
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">
          Signed in?{' '}
          <Link href="/my-bookings" className="text-[#1a3570] font-semibold hover:underline">
            My bookings
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
