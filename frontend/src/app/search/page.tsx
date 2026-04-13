'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { flightApi } from '../../lib/api';
import FlightCard from '../../components/flight/FlightCard';
import toast from 'react-hot-toast';

const CABIN_SET = new Set(['economy', 'premium_economy', 'business', 'first']);

function SearchPageContent() {
  const params  = useSearchParams();
  const router  = useRouter();
  const [flights, setFlights]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [sortBy, setSortBy]     = useState('price');
  const [totalFound, setTotal]  = useState(0);
  const [searchError, setSearchError] = useState<string | null>(null);

  const origin      = (params.get('origin') || '').trim().toUpperCase();
  const destination = (params.get('destination') || '').trim().toUpperCase();
  const depDate     = (params.get('departureDate') || '').trim();
  const rawCabin    = params.get('cabinClass') || 'economy';
  const cabinClass  = CABIN_SET.has(rawCabin) ? rawCabin : 'economy';
  const adults      = params.get('adults') || '1';
  const children    = params.get('children') || '0';
  const infants     = params.get('infants') || '0';

  const paramsReady = origin.length === 3 && destination.length === 3 && /^\d{4}-\d{2}-\d{2}$/.test(depDate);

  useEffect(() => {
    if (!paramsReady) {
      setSearchError(
        !origin && !destination && !depDate
          ? 'Start by searching from the home page.'
          : 'This search link is incomplete — use 3-letter airports (e.g. DXB → LHR) and a departure date.',
      );
      setFlights([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setSearchError(null);
    setLoading(true);
    flightApi.search({
      origin,
      destination,
      departureDate: depDate,
      cabinClass,
      adults,
      children,
      infants,
      sortBy,
    })
      .then(({ data }) => { setFlights(data.data?.flights || []); setTotal(data.data?.total || 0); })
      .catch((err: { response?: { status?: number; data?: { details?: { message?: string }[]; error?: string } } }) => {
        setFlights([]);
        setTotal(0);
        const msg = err?.response?.data?.error === 'Validation failed'
          ? 'Invalid search parameters. Check airports (3 letters) and date.'
          : (err?.response?.data?.error || 'Search failed');
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [origin, destination, depDate, cabinClass, adults, children, infants, sortBy, paramsReady]);

  const handleSelect = (flight: any, fare: any) => {
    const fid = flight._id ?? flight.id;
    const fareId = fare._id ?? fare.id;
    router.push(`/booking?flightId=${fid}&fareId=${fareId}&cabinClass=${cabinClass}&adults=${adults}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="bg-[#1a3570] text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-xl font-semibold">{origin} → {destination}</h1>
          <p className="text-blue-200 text-sm">{depDate} · {adults} adult{+adults>1?'s':''} · {cabinClass}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 w-full flex-1">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">{loading ? 'Searching...' : `${totalFound} flight${totalFound !== 1 ? 's' : ''} found`}</p>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#1a3570] outline-none">
              <option value="price">Cheapest</option>
              <option value="duration">Fastest</option>
              <option value="departure">Earliest departure</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-xl h-36 animate-pulse" />)}
          </div>
        ) : !paramsReady ? (
          <div className="text-center py-20 bg-white rounded-xl px-4">
            <p className="text-lg font-semibold text-gray-800">{searchError}</p>
            <p className="text-gray-500 mt-2 text-sm">Go back to the home page and run a new search.</p>
          </div>
        ) : flights.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl">
            <p className="text-4xl mb-4">✈️</p>
            <p className="text-lg font-semibold text-gray-700">No flights found</p>
            <p className="text-gray-500 mt-2">Try different dates or nearby airports</p>
          </div>
        ) : (
          <div className="space-y-3">
            {flights.map((f: any) => (
              <FlightCard key={f._id ?? f.id} flight={f} cabinClass={cabinClass} onSelect={handleSelect} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500">Loading…</p></div>}>
      <SearchPageContent />
    </Suspense>
  );
}
