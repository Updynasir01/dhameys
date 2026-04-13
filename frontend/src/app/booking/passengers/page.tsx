'use client';
// src/app/booking/passengers/page.tsx
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { useBookingStore } from '../../../store/bookingStore';
import { useAuthStore }    from '../../../store/auth.store';
import { useEffect }       from 'react';
import { User, Plane, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const TITLES   = ['Mr','Mrs','Ms','Miss','Dr','Prof'];
const MEALS    = ['None','AVML','BBML','CHML','DBML','GFML','HNML','KSML','MOML','VGML','VLML'];

export default function PassengersPage() {
  const router = useRouter();
  const { selectedOutbound, selectedFare, searchParams, setPassengers } = useBookingStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!selectedOutbound || !selectedFare) router.replace('/');
  }, [selectedOutbound, selectedFare, router]);

  const totalPax = (searchParams?.adults || 1) + (searchParams?.children || 0) + (searchParams?.infants || 0);

  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      passengers: Array.from({ length: totalPax }, (_, i) => ({
        passengerType: i < (searchParams?.adults || 1) ? 'adult' : i < (searchParams?.adults || 1) + (searchParams?.children || 0) ? 'child' : 'infant',
        title: '', firstName: i === 0 ? (user?.firstName || '') : '',
        lastName: i === 0 ? (user?.lastName || '') : '',
        dateOfBirth: '', nationality: '', passportNumber: '',
        passportExpiry: '', passportCountry: '', mealPreference: '',
      })),
    },
  });

  const { fields } = useFieldArray({ control, name: 'passengers' });

  function onSubmit(data: { passengers: object[] }) {
    setPassengers(data.passengers as Parameters<typeof setPassengers>[0]);
    router.push('/booking/seats');
  }

  if (!selectedOutbound) return null;

  const raw = selectedOutbound as unknown as Record<string, unknown>;
  const routeCodes = {
    from: String(
      (selectedOutbound.origin as { iataCode?: string } | undefined)?.iataCode
        ?? raw.originIata
        ?? raw.origin_iata
        ?? '',
    ),
    to: String(
      (selectedOutbound.destination as { iataCode?: string } | undefined)?.iataCode
        ?? raw.destIata
        ?? raw.dest_iata
        ?? '',
    ),
    depLabel: (() => {
      const t = selectedOutbound.departureTime ?? raw.departure_time;
      return t ? new Date(String(t)).toLocaleDateString() : '';
    })(),
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        {['Flight', 'Passengers', 'Seats', 'Add-ons', 'Payment'].map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
            <span className={clsx(i === 1 ? 'text-brand-600 font-semibold' : '')}>{step}</span>
          </div>
        ))}
      </div>

      {/* Flight summary */}
      <div className="card p-4 mb-6 flex items-center gap-4">
        <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
          <Plane className="w-5 h-5 text-brand-600 rotate-90" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900">
            {routeCodes.from} → {routeCodes.to}
          </div>
          <div className="text-sm text-gray-500">
            {routeCodes.depLabel} · {selectedFare?.cabinClass?.replace('_', ' ')}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-brand-700">${(selectedFare?.totalPrice ?? 0).toFixed(0)}</div>
          <div className="text-xs text-gray-400">per person</div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field, idx) => (
          <div key={field.id} className="card overflow-hidden">
            <div className="bg-brand-600 px-5 py-3 flex items-center gap-2">
              <User className="w-4 h-4 text-white" />
              <span className="text-white font-semibold text-sm">
                Passenger {idx + 1} — {(field as Record<string, string>).passengerType?.charAt(0).toUpperCase() + (field as Record<string, string>).passengerType?.slice(1)}
              </span>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                <select {...register(`passengers.${idx}.title`)} className="input-field text-sm">
                  <option value="">Select</option>
                  {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-1" />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">First Name *</label>
                <input {...register(`passengers.${idx}.firstName`, { required: true })}
                  className={clsx('input-field text-sm', errors.passengers?.[idx]?.firstName && 'border-red-400')}
                  placeholder="As on passport" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Last Name *</label>
                <input {...register(`passengers.${idx}.lastName`, { required: true })}
                  className={clsx('input-field text-sm', errors.passengers?.[idx]?.lastName && 'border-red-400')}
                  placeholder="As on passport" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date of Birth *</label>
                <input type="date" {...register(`passengers.${idx}.dateOfBirth`, { required: true })}
                  className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nationality</label>
                <input {...register(`passengers.${idx}.nationality`)}
                  className="input-field text-sm uppercase" maxLength={2} placeholder="e.g. AE" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Passport Number</label>
                <input {...register(`passengers.${idx}.passportNumber`)}
                  className="input-field text-sm" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Passport Expiry</label>
                <input type="date" {...register(`passengers.${idx}.passportExpiry`)} className="input-field text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Meal Preference</label>
                <select {...register(`passengers.${idx}.mealPreference`)} className="input-field text-sm">
                  {MEALS.map(m => <option key={m} value={m === 'None' ? '' : m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-between pt-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Back</button>
          <button type="submit" className="btn-primary flex items-center gap-2">
            Continue to Seats <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
