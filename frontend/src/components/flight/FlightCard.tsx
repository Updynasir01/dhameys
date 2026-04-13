'use client';
import { useState } from 'react';

interface Props { flight: any; cabinClass: string; onSelect: (f: any, fare: any) => void; }

export default function FlightCard({ flight, cabinClass, onSelect }: Props) {
  const [expanded, setExpanded] = useState(false);
  const fare = flight.fares?.find((f: any) => (f.cabinClass ?? f.cabin_class) === cabinClass) || flight.fares?.[0];
  if (!fare) return null;

  const dep  = new Date(flight.departureTime ?? flight.departure_time);
  const arr  = new Date(flight.arrivalTime ?? flight.arrival_time);
  const dur  = flight.durationMin ?? flight.duration_min ?? 0;
  const hrs  = Math.floor(dur / 60);
  const mins = dur % 60;

  const statusColors: Record<string, string> = {
    scheduled: 'bg-green-100 text-green-700',
    delayed:   'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-700',
    boarding:  'bg-blue-100 text-blue-700',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
        {/* Flight info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {flight.flightNumber ?? flight.flight_number}
            </span>
            {flight.status && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[flight.status] || 'bg-gray-100 text-gray-600'}`}>
                {flight.status}
              </span>
            )}
            {(flight.aircraftType ?? flight.aircraft_type) && (
              <span className="text-xs text-gray-400">{(flight.aircraftType ?? flight.aircraft_type)?.replace('_', ' ')}</span>
            )}
          </div>

          <div className="flex items-center gap-6 mt-2">
            {/* Departure */}
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {dep.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-sm font-semibold text-[#1a3570]">{flight.originIata ?? flight.origin_iata}</p>
              <p className="text-xs text-gray-400">{flight.originCity ?? flight.origin_city}</p>
            </div>

            {/* Duration */}
            <div className="flex-1 flex flex-col items-center">
              <p className="text-xs text-gray-400 mb-1">{hrs}h {mins}m</p>
              <div className="relative w-full flex items-center">
                <div className="h-px bg-gray-200 flex-1" />
                <span className="mx-2 text-gray-300 text-xs">✈</span>
                <div className="h-px bg-gray-200 flex-1" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Direct</p>
            </div>

            {/* Arrival */}
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {arr.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-sm font-semibold text-[#1a3570]">{flight.destIata ?? flight.dest_iata}</p>
              <p className="text-xs text-gray-400">{flight.destCity ?? flight.dest_city}</p>
            </div>
          </div>

          {/* Baggage */}
          <div className="flex gap-3 mt-3 text-xs text-gray-500">
            <span>🧳 {flight.checkedBaggageKg ?? flight.checked_baggage_kg ?? 23}kg checked</span>
            <span>👜 {flight.cabinBaggageKg ?? flight.cabin_baggage_kg ?? 7}kg cabin</span>
            {fare.refundable && <span className="text-green-600">✓ Refundable</span>}
          </div>
        </div>

        {/* Price & select */}
        <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-2 md:text-right">
          <div>
            <p className="text-xs text-gray-400">{cabinClass.replace('_', ' ')}</p>
            <p className="text-2xl font-bold text-[#1a3570]">
              {fare.currency}{' '}
              {(fare.totalPrice != null
                ? Number(fare.totalPrice)
                : parseFloat(fare.total_price || String(Number(fare.basePrice ?? fare.base_price) + 85))
              ).toFixed(0)}
            </p>
            <p className="text-xs text-gray-400">per person, taxes included</p>
          </div>
          <button
            onClick={() => onSelect(flight, fare)}
            className="bg-[#1a3570] hover:bg-[#1e4080] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors whitespace-nowrap"
          >
            Select →
          </button>
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-600 hover:underline">
            {expanded ? 'Hide details' : 'Flight details'}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t bg-gray-50 px-5 py-4 grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Departure</p>
            <p className="font-semibold">{dep.toLocaleString()}</p>
            <p className="text-gray-500">Terminal {(flight.departureTerminal ?? flight.departure_terminal) || '-'}, Gate {(flight.departureGate ?? flight.departure_gate) || 'TBD'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Arrival</p>
            <p className="font-semibold">{arr.toLocaleString()}</p>
            <p className="text-gray-500">Terminal {(flight.arrivalTerminal ?? flight.arrival_terminal) || '-'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Fare Details</p>
            <p>Base: {fare.currency} {Number(fare.basePrice ?? fare.base_price).toFixed(2)}</p>
            <p>Taxes & fees: {fare.currency} {(Number(fare.taxAmount ?? fare.tax_amount ?? 0) + Number(fare.fuelSurcharge ?? fare.fuel_surcharge ?? 0) + 15).toFixed(2)}</p>
            <p className="font-semibold mt-1">Total: {fare.currency} {(fare.totalPrice != null ? Number(fare.totalPrice) : parseFloat(String(fare.total_price || Number(fare.basePrice ?? fare.base_price) + 85))).toFixed(2)}</p>
            {(fare.milesEarned ?? fare.miles_earned) ? <p className="text-blue-600 mt-1">✈ Earn {fare.milesEarned ?? fare.miles_earned} miles</p> : null}
          </div>
        </div>
      )}
    </div>
  );
}
