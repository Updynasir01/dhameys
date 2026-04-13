'use client';
import { useState, useEffect, useRef } from 'react';
import { flightApi } from '../../lib/api';

interface SearchFormProps { onSearch: (p: URLSearchParams) => void; }

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [tripType, setTripType]     = useState<'one_way'|'round_trip'>('round_trip');
  const [origin, setOrigin]         = useState({ iata: '', city: '', display: '' });
  const [dest, setDest]             = useState({ iata: '', city: '', display: '' });
  const [depDate, setDepDate]       = useState('');
  const [retDate, setRetDate]       = useState('');
  const [adults, setAdults]         = useState(1);
  const [children, setChildren]     = useState(0);
  const [cabinClass, setCabinClass] = useState('economy');
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions]     = useState<any[]>([]);
  const [originInput, setOriginInput] = useState('');
  const [destInput, setDestInput]     = useState('');
  const originRef = useRef<ReturnType<typeof setTimeout>>();
  const destRef   = useRef<ReturnType<typeof setTimeout>>();

  const today = new Date().toISOString().split('T')[0];

  const fetchSuggestions = (q: string, setter: (r: any[]) => void, timer: React.MutableRefObject<ReturnType<typeof setTimeout>|undefined>) => {
    clearTimeout(timer.current);
    if (q.length < 2) { setter([]); return; }
    timer.current = setTimeout(async () => {
      try {
        const { data } = await flightApi.autocomplete(q);
        setter(data.data || []);
      } catch { setter([]); }
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.iata || !dest.iata || !depDate) return;
    const p = new URLSearchParams({
      origin: origin.iata, destination: dest.iata,
      departureDate: depDate, cabinClass, adults: String(adults),
      children: String(children), tripType,
      ...(tripType === 'round_trip' && retDate ? { returnDate: retDate } : {}),
    });
    onSearch(p);
  };

  const iata = (ap: Record<string, string | undefined>) => String(ap.iataCode ?? ap.iata_code ?? '').toUpperCase();
  const countryLabel = (ap: Record<string, string | undefined>) => ap.countryName ?? ap.country_name ?? '';

  const selectAirport = (ap: Record<string, string | undefined>, type: 'origin'|'dest') => {
    const code = iata(ap);
    const display = `${ap.city} (${code})`;
    if (type === 'origin') {
      setOrigin({ iata: code, city: String(ap.city ?? ''), display });
      setOriginInput(display);
      setOriginSuggestions([]);
    } else {
      setDest({ iata: code, city: String(ap.city ?? ''), display });
      setDestInput(display);
      setDestSuggestions([]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-gray-900">
      {/* Trip type */}
      <div className="flex gap-4 text-sm">
        {(['one_way','round_trip'] as const).map(t => (
          <label key={t} className="flex items-center gap-2 cursor-pointer text-gray-700">
            <input type="radio" value={t} checked={tripType === t} onChange={() => setTripType(t)} className="accent-[#1a3570]" />
            {t === 'one_way' ? 'One Way' : 'Round Trip'}
          </label>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Origin */}
        <div className="relative lg:col-span-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input
            value={originInput}
            onChange={e => { setOriginInput(e.target.value); fetchSuggestions(e.target.value, setOriginSuggestions, originRef); }}
            placeholder="City or airport"
            className="w-full bg-white text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1a3570] focus:border-transparent outline-none"
            required
          />
          {originSuggestions.length > 0 && (
            <div className="absolute z-20 bg-white border rounded-xl shadow-lg w-full mt-1 max-h-48 overflow-auto">
              {originSuggestions.map((ap: Record<string, string | undefined>) => (
                <button key={iata(ap)} type="button" onClick={() => selectAirport(ap, 'origin')}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm">
                  <span className="font-semibold text-[#1a3570]">{iata(ap)}</span>
                  <span className="text-gray-600 ml-2">{ap.city}, {countryLabel(ap)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Destination */}
        <div className="relative lg:col-span-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input
            value={destInput}
            onChange={e => { setDestInput(e.target.value); fetchSuggestions(e.target.value, setDestSuggestions, destRef); }}
            placeholder="City or airport"
            className="w-full bg-white text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1a3570] focus:border-transparent outline-none"
            required
          />
          {destSuggestions.length > 0 && (
            <div className="absolute z-20 bg-white border rounded-xl shadow-lg w-full mt-1 max-h-48 overflow-auto">
              {destSuggestions.map((ap: Record<string, string | undefined>) => (
                <button key={iata(ap)} type="button" onClick={() => selectAirport(ap, 'dest')}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm">
                  <span className="font-semibold text-[#1a3570]">{iata(ap)}</span>
                  <span className="text-gray-600 ml-2">{ap.city}, {countryLabel(ap)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-2 lg:col-span-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Departure</label>
            <input type="date" min={today} value={depDate} onChange={e => setDepDate(e.target.value)}
              className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1a3570] outline-none" required />
          </div>
          {tripType === 'round_trip' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Return</label>
              <input type="date" min={depDate || today} value={retDate} onChange={e => setRetDate(e.target.value)}
                className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1a3570] outline-none" />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        {/* Passengers */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Adults</label>
          <select value={adults} onChange={e => setAdults(+e.target.value)}
            className="bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1a3570] outline-none">
            {[1,2,3,4,5,6,7,8,9].map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Children</label>
          <select value={children} onChange={e => setChildren(+e.target.value)}
            className="bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1a3570] outline-none">
            {[0,1,2,3,4,5,6].map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
          <select value={cabinClass} onChange={e => setCabinClass(e.target.value)}
            className="bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1a3570] outline-none">
            <option value="economy">Economy</option>
            <option value="premium_economy">Premium Economy</option>
            <option value="business">Business</option>
            <option value="first">First Class</option>
          </select>
        </div>
        <button type="submit"
          className="ml-auto bg-[#1a3570] hover:bg-[#1e4080] text-white px-8 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2">
          🔍 Search Flights
        </button>
      </div>
    </form>
  );
}
