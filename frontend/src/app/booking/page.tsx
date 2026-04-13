'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { flightApi, bookingApi } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import toast from 'react-hot-toast';

function BookingPageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [flight, setFlight]   = useState<any>(null);
  const [fare, setFare]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const adults = parseInt(params.get('adults') || '1');
  const cabinClass = params.get('cabinClass') || 'economy';

  const emptyPax = () => ({ firstName:'', lastName:'', passengerType:'adult', dateOfBirth:'', passportNumber:'', passportExpiry:'', nationality:'', mealPreference:'' });
  const [passengers, setPassengers] = useState(() => Array.from({ length: adults }, emptyPax));
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [promoCode, setPromoCode] = useState('');

  useEffect(() => {
    const flightId = params.get('flightId');
    const fareId = params.get('fareId');
    if (!flightId) return;
    flightApi.getById(flightId).then(({ data }) => {
      const fl = data.data;
      setFlight(fl);
      const fares = fl?.fares || [];
      const f =
        fares.find((x: { _id?: string; id?: string }) => String(x._id ?? x.id) === String(fareId)) ||
        fares.find((x: { cabinClass?: string; cabin_class?: string }) => (x.cabinClass ?? x.cabin_class) === cabinClass) ||
        fares[0];
      setFare(f || null);
    }).finally(() => setLoading(false));
  }, []);

  const updPax = (i: number, k: string, v: string) => {
    setPassengers(ps => ps.map((p, idx) => idx === i ? { ...p, [k]: v } : p));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const fid = flight._id ?? flight.id;
      const fareId = fare._id ?? fare.id;
      const { data } = await bookingApi.create({
        tripType: 'one_way',
        outboundFlightId: String(fid),
        fareRuleId: String(fareId),
        cabinClass, passengers, contactEmail, promoCode: promoCode || undefined,
      });
      const b = data.data;
      const ref = b.bookingRef ?? b.booking_ref;
      const id = b._id ?? b.id;
      const qs = new URLSearchParams({ bookingId: String(id), ref: String(ref) });
      router.push(`/booking/payment?${qs.toString()}`);
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Booking failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Loading flight details...</p></div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 w-full flex-1">
        <h1 className="text-2xl font-bold mb-6">Complete Your Booking</h1>
        <div className="grid lg:grid-cols-3 gap-6">
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {passengers.map((p, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4">Passenger {i + 1} — {p.passengerType}</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[['firstName','First Name'],['lastName','Last Name'],['dateOfBirth','Date of Birth'],['nationality','Nationality (2-letter)'],['passportNumber','Passport Number'],['passportExpiry','Passport Expiry']].map(([k, label]) => (
                    <div key={k}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <input type={k.includes('Date') || k.includes('Expiry') ? 'date' : 'text'}
                        value={(p as any)[k]} onChange={e => updPax(i, k, e.target.value)}
                        required={['firstName','lastName'].includes(k)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a3570] outline-none" />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="font-semibold mb-4">Contact Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email (booking confirmation will be sent here)</label>
                  <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a3570] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Promo Code (optional)</label>
                  <input value={promoCode} onChange={e => setPromoCode(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a3570] outline-none" placeholder="e.g. DHAMEYS10" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-[#1a3570] text-white py-4 rounded-xl font-bold text-base hover:bg-[#1e4080] transition disabled:opacity-50">
              {submitting ? 'Creating booking...' : 'Continue to Payment →'}
            </button>
          </form>

          {/* Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 shadow-sm sticky top-20">
              <h3 className="font-semibold mb-4">Booking Summary</h3>
              {flight && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between font-mono font-bold text-[#1a3570] text-base">
                    <span>{flight.originIata ?? flight.origin_iata}</span><span>→</span><span>{flight.destIata ?? flight.dest_iata}</span>
                  </div>
                  <p className="text-gray-500">
                    {flight.flightNumber ?? flight.flight_number}
                    {(() => {
                      const dep = flight.departureTime ?? flight.departure_time;
                      return dep ? ` · ${new Date(dep).toLocaleDateString()}` : '';
                    })()}
                  </p>
                  <p className="text-gray-500">
                    {(() => {
                      const dep = flight.departureTime ?? flight.departure_time;
                      const arr = flight.arrivalTime ?? flight.arrival_time;
                      if (!dep || !arr) return null;
                      return `${new Date(dep).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} → ${new Date(arr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
                    })()}
                  </p>
                  <p className="text-gray-500 capitalize">{cabinClass.replace('_',' ')} · {adults} passenger{adults>1?'s':''}</p>
                  <hr />
                  {fare && (
                    <>
                      <div className="flex justify-between text-gray-600"><span>Base fare</span><span>{fare.currency} {(Number(fare.basePrice ?? fare.base_price ?? 0) * adults).toFixed(2)}</span></div>
                      <div className="flex justify-between text-gray-600"><span>Taxes & fees</span><span>{fare.currency} {((Number(fare.taxAmount ?? fare.tax_amount ?? 0) + Number(fare.fuelSurcharge ?? fare.fuel_surcharge ?? 0) + 15) * adults).toFixed(2)}</span></div>
                      <hr />
                      <div className="flex justify-between font-bold text-gray-900 text-base"><span>Total</span><span>{fare.currency} {(Number(fare.totalPrice ?? fare.total_price ?? (Number(fare.basePrice ?? fare.base_price ?? 0) + Number(fare.taxAmount ?? fare.tax_amount ?? 0) + Number(fare.fuelSurcharge ?? fare.fuel_surcharge ?? 0) + 15)) * adults).toFixed(2)}</span></div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500">Loading…</p></div>}>
      <BookingPageContent />
    </Suspense>
  );
}
