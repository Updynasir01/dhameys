'use client';
// src/components/flight/FlightSearchForm.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '../../store/bookingStore';
import { Search, ArrowLeftRight, ChevronDown, Plus, Minus } from 'lucide-react';
import clsx from 'clsx';
import type { CabinClass } from '../../../../shared/types';

const CABIN_OPTIONS: { value: CabinClass; label: string }[] = [
  { value: 'economy',         label: 'Economy' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business',        label: 'Business' },
  { value: 'first',           label: 'First Class' },
];

export function FlightSearchForm() {
  const router = useRouter();
  const setSearchParams = useBookingStore(s => s.setSearchParams);

  const [tripType,       setTripType]       = useState<'one_way'|'round_trip'>('one_way');
  const [origin,         setOrigin]         = useState('');
  const [destination,    setDestination]    = useState('');
  const [departureDate,  setDepartureDate]  = useState('');
  const [returnDate,     setReturnDate]     = useState('');
  const [cabinClass,     setCabinClass]     = useState<CabinClass>('economy');
  const [adults,         setAdults]         = useState(1);
  const [children,       setChildren]       = useState(0);
  const [infants,        setInfants]        = useState(0);
  const [passengerOpen,  setPassengerOpen]  = useState(false);
  const [cabinOpen,      setCabinOpen]      = useState(false);

  const totalPassengers = adults + children + infants;

  function swapAirports() {
    setOrigin(destination);
    setDestination(origin);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!origin || !destination || !departureDate) return;

    const params = {
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      returnDate: tripType === 'round_trip' ? returnDate : undefined,
      adults, children, infants, cabinClass,
      tripType: tripType as 'one_way' | 'round_trip',
    };
    setSearchParams(params);

    const qs = new URLSearchParams({
      origin: params.origin, destination: params.destination,
      departureDate, adults: String(adults), children: String(children),
      infants: String(infants), cabinClass, tripType,
      ...(returnDate ? { returnDate } : {}),
    });
    router.push(`/search?${qs}`);
  }

  const Counter = ({ label, value, setValue, min = 0, max = 9 }: {
    label: string; value: number; setValue: (v: number) => void; min?: number; max?: number;
  }) => (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-gray-700 font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setValue(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
          disabled={value <= min}>
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-5 text-center font-semibold text-gray-900">{value}</span>
        <button type="button" onClick={() => setValue(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
          disabled={value >= max}>
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white text-gray-900 rounded-2xl shadow-xl p-6 max-w-4xl mx-auto">
      {/* Trip type tabs */}
      <div className="flex gap-2 mb-5">
        {(['one_way', 'round_trip'] as const).map(t => (
          <button key={t} type="button" onClick={() => setTripType(t)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tripType === t ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            )}>
            {t === 'one_way' ? 'One Way' : 'Round Trip'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {/* Origin */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              value={origin}
              onChange={e => setOrigin(e.target.value.toUpperCase())}
              className="input-field text-base font-semibold uppercase tracking-wider pr-10"
              placeholder="DXB"
              maxLength={3}
              required
            />
            <button type="button" onClick={swapAirports}
              className="absolute right-2 bottom-2 w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center hover:bg-brand-100 transition-colors">
              <ArrowLeftRight className="w-3.5 h-3.5 text-brand-600" />
            </button>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              value={destination}
              onChange={e => setDestination(e.target.value.toUpperCase())}
              className="input-field text-base font-semibold uppercase tracking-wider"
              placeholder="LHR"
              maxLength={3}
              required
            />
          </div>

          {/* Departure Date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Departure</label>
            <input
              type="date"
              value={departureDate}
              onChange={e => setDepartureDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="input-field"
              required
            />
          </div>

          {/* Return Date / Passengers */}
          {tripType === 'round_trip' ? (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Return</label>
              <input
                type="date"
                value={returnDate}
                onChange={e => setReturnDate(e.target.value)}
                min={departureDate || new Date().toISOString().split('T')[0]}
                className="input-field"
              />
            </div>
          ) : (
            /* Passengers dropdown */
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1">Passengers</label>
              <button type="button" onClick={() => { setPassengerOpen(!passengerOpen); setCabinOpen(false); }}
                className="input-field flex items-center justify-between text-left">
                <span className="font-medium">{totalPassengers} Passenger{totalPassengers !== 1 ? 's' : ''}</span>
                <ChevronDown className={clsx('w-4 h-4 text-gray-400 transition-transform', passengerOpen && 'rotate-180')} />
              </button>
              {passengerOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-20">
                  <Counter label="Adults (12+)"    value={adults}   setValue={setAdults}   min={1} />
                  <Counter label="Children (2–11)" value={children} setValue={setChildren} />
                  <Counter label="Infants (<2)"    value={infants}  setValue={setInfants}  max={adults} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Second row: cabin + passengers (for round trip) + search button */}
        <div className="flex flex-wrap gap-3 items-end">
          {tripType === 'round_trip' && (
            <div className="relative flex-1 min-w-[180px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Passengers</label>
              <button type="button" onClick={() => { setPassengerOpen(!passengerOpen); setCabinOpen(false); }}
                className="input-field flex items-center justify-between text-left">
                <span className="font-medium">{totalPassengers} Passenger{totalPassengers !== 1 ? 's' : ''}</span>
                <ChevronDown className={clsx('w-4 h-4 text-gray-400 transition-transform', passengerOpen && 'rotate-180')} />
              </button>
              {passengerOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-20">
                  <Counter label="Adults (12+)"    value={adults}   setValue={setAdults}   min={1} />
                  <Counter label="Children (2–11)" value={children} setValue={setChildren} />
                  <Counter label="Infants (<2)"    value={infants}  setValue={setInfants}  max={adults} />
                </div>
              )}
            </div>
          )}

          <div className="relative flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Cabin Class</label>
            <button type="button" onClick={() => { setCabinOpen(!cabinOpen); setPassengerOpen(false); }}
              className="input-field flex items-center justify-between text-left">
              <span className="font-medium">{CABIN_OPTIONS.find(c => c.value === cabinClass)?.label}</span>
              <ChevronDown className={clsx('w-4 h-4 text-gray-400 transition-transform', cabinOpen && 'rotate-180')} />
            </button>
            {cabinOpen && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                {CABIN_OPTIONS.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => { setCabinClass(opt.value); setCabinOpen(false); }}
                    className={clsx('w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors',
                      cabinClass === opt.value ? 'text-brand-600 font-semibold' : 'text-gray-700')}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button type="submit"
            className="btn-primary flex items-center gap-2 px-8 py-3 flex-shrink-0">
            <Search className="w-4 h-4" />
            Search Flights
          </button>
        </div>
      </form>
    </div>
  );
}
