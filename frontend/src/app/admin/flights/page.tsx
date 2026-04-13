'use client';
// src/app/admin/flights/page.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../lib/api';
import { Plus, Search, Edit, Trash2, Plane, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import clsx from 'clsx';

const STATUS_OPTIONS = ['scheduled','delayed','boarding','cancelled','diverted'];
const STATUS_ICONS: Record<string, React.ReactNode> = {
  scheduled: <CheckCircle className="w-3.5 h-3.5 text-green-600" />,
  delayed:   <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
  boarding:  <Clock className="w-3.5 h-3.5 text-blue-600" />,
  cancelled: <XCircle className="w-3.5 h-3.5 text-red-600" />,
  diverted:  <Plane className="w-3.5 h-3.5 text-gray-600" />,
};

/** Mongo returns camelCase; older UI expected snake_case */
function flightRow(f: Record<string, unknown>) {
  const id = String(f._id ?? f.id ?? '');
  return {
    id,
    flightNumber: String(f.flightNumber ?? f.flight_number ?? ''),
    originIata: String(f.originIata ?? f.origin_iata ?? ''),
    destIata: String(f.destIata ?? f.dest_iata ?? ''),
    originCity: String(f.originCity ?? f.origin_city ?? ''),
    departureTime: f.departureTime ?? f.departure_time,
    arrivalTime: f.arrivalTime ?? f.arrival_time,
    economyAvailable: Number(f.economyAvailable ?? f.economy_available ?? 0),
    businessAvailable: Number(f.businessAvailable ?? f.business_available ?? 0),
    confirmedPax: Number(f.confirmedPax ?? f.confirmed_pax ?? 0),
    status: String(f.status ?? ''),
  };
}

export default function AdminFlightsPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status: '', origin: '', date: '', page: 1 });
  const [editFlight, setEditFlight] = useState<Record<string, string> | null>(null);
  const [showAdd,    setShowAdd]    = useState(false);
  const [newFlight,  setNewFlight]  = useState({ flightNumber:'', origin:'', destination:'', departureTime:'', arrivalTime:'', economyAvailable:'150', businessAvailable:'20' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-flights', filters],
    queryFn:  () => adminApi.listFlights(filters).then(r => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => adminApi.updateFlight(id, data),
    onSuccess:  () => { toast.success('Flight updated'); qc.invalidateQueries({ queryKey: ['admin-flights'] }); setEditFlight(null); },
    onError:    () => toast.error('Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteFlight(id),
    onSuccess:  () => { toast.success('Flight deleted'); qc.invalidateQueries({ queryKey: ['admin-flights'] }); },
    onError:    (err: { response?: { data?: { error?: string } } }) => toast.error(err?.response?.data?.error || 'Delete failed'),
  });

  const createMutation = useMutation({
    mutationFn: (d: object) => adminApi.createFlight(d),
    onSuccess:  () => { toast.success('Flight created'); qc.invalidateQueries({ queryKey: ['admin-flights'] }); setShowAdd(false); },
    onError:    () => toast.error('Create failed'),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/admin" className="hover:text-brand-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Flights</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Flight Management</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
          <Plus className="w-4 h-4" /> Add Flight
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3">
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
          className="input-field w-40 text-sm py-2">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input value={filters.origin} onChange={e => setFilters(f => ({ ...f, origin: e.target.value.toUpperCase(), page: 1 }))}
          className="input-field w-28 text-sm py-2 uppercase" placeholder="Origin (DXB)" maxLength={3} />
        <input type="date" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value, page: 1 }))}
          className="input-field w-44 text-sm py-2" />
        <button onClick={() => setFilters({ status:'', origin:'', date:'', page:1 })}
          className="btn-ghost text-sm py-2 px-3">Clear</button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <tr>
                {['Flight', 'Route', 'Departure', 'Arrival', 'Seats (E/B)', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-5 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))}
              {!isLoading && !data?.flights?.length && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No flights found</td></tr>
              )}
              {(data?.flights || []).map((raw: Record<string, unknown>) => {
                const f = flightRow(raw);
                return (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-brand-700">{f.flightNumber || '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {f.originIata} <span className="text-gray-400">→</span> {f.destIata}
                    {f.originCity ? <div className="text-xs text-gray-400">{f.originCity}</div> : null}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {f.departureTime ? new Date(String(f.departureTime)).toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'}) : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {f.arrivalTime ? new Date(String(f.arrivalTime)).toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'}) : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="text-green-700">{f.economyAvailable}</span>
                    <span className="text-gray-300"> / </span>
                    <span className="text-blue-700">{f.businessAvailable}</span>
                    <div className="text-xs text-gray-400">{f.confirmedPax} pax confirmed</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', {
                      'bg-green-100 text-green-800': f.status === 'scheduled',
                      'bg-amber-100 text-amber-800': f.status === 'delayed',
                      'bg-blue-100 text-blue-800':   f.status === 'boarding',
                      'bg-red-100 text-red-800':     f.status === 'cancelled',
                      'bg-gray-100 text-gray-700':   !['scheduled','delayed','boarding','cancelled'].includes(f.status),
                    })}>
                      {STATUS_ICONS[f.status]}
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditFlight({
                        id: f.id,
                        flight_number: f.flightNumber,
                        status: f.status,
                        delay_minutes: String(raw.delayMinutes ?? raw.delay_minutes ?? '0'),
                        departure_gate: String(raw.departureGate ?? raw.departure_gate ?? ''),
                        delay_reason: String(raw.delayReason ?? raw.delay_reason ?? ''),
                      })}
                        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if (confirm(`Delete flight ${f.flightNumber}?`)) deleteMutation.mutate(f.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {data?.total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>{data.total} total flights</span>
            <div className="flex gap-2">
              <button disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                className="btn-ghost py-1 px-3 disabled:opacity-40">← Prev</button>
              <span>Page {filters.page} of {Math.ceil(data.total / 20)}</span>
              <button disabled={filters.page >= Math.ceil(data.total / 20)}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                className="btn-ghost py-1 px-3 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editFlight && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-bold text-gray-900 mb-4">Edit Flight {editFlight.flight_number}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select value={editFlight.status || ''} onChange={e => setEditFlight(f => ({ ...f!, status: e.target.value }))}
                  className="input-field text-sm">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Delay (minutes)</label>
                <input type="number" value={editFlight.delay_minutes || '0'}
                  onChange={e => setEditFlight(f => ({ ...f!, delay_minutes: e.target.value }))}
                  className="input-field text-sm" min={0} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Gate</label>
                <input value={editFlight.departure_gate || ''}
                  onChange={e => setEditFlight(f => ({ ...f!, departure_gate: e.target.value }))}
                  className="input-field text-sm" placeholder="e.g. B14" />
              </div>
              {editFlight.status === 'delayed' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Delay reason</label>
                  <input value={editFlight.delay_reason || ''}
                    onChange={e => setEditFlight(f => ({ ...f!, delay_reason: e.target.value }))}
                    className="input-field text-sm" placeholder="Operational delay" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditFlight(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => updateMutation.mutate({ id: editFlight.id, data: { status: editFlight.status, delayMinutes: editFlight.delay_minutes, departureGate: editFlight.departure_gate, delayReason: editFlight.delay_reason } })}
                className="btn-primary flex-1" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add flight modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-bold text-gray-900 mb-4">Add New Flight</h2>
            <div className="space-y-3">
              {[
                { label: 'Flight Number', key: 'flightNumber', placeholder: 'DH-501' },
                { label: 'Origin IATA',   key: 'origin',       placeholder: 'DXB' },
                { label: 'Destination',   key: 'destination',  placeholder: 'LHR' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                  <input value={(newFlight as Record<string, string>)[key]} placeholder={placeholder}
                    onChange={e => setNewFlight(f => ({ ...f, [key]: e.target.value.toUpperCase() }))}
                    className="input-field text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Departure Time</label>
                <input type="datetime-local" value={newFlight.departureTime}
                  onChange={e => setNewFlight(f => ({ ...f, departureTime: e.target.value }))}
                  className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Arrival Time</label>
                <input type="datetime-local" value={newFlight.arrivalTime}
                  onChange={e => setNewFlight(f => ({ ...f, arrivalTime: e.target.value }))}
                  className="input-field text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Economy seats</label>
                  <input type="number" value={newFlight.economyAvailable}
                    onChange={e => setNewFlight(f => ({ ...f, economyAvailable: e.target.value }))}
                    className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Business seats</label>
                  <input type="number" value={newFlight.businessAvailable}
                    onChange={e => setNewFlight(f => ({ ...f, businessAvailable: e.target.value }))}
                    className="input-field text-sm" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => createMutation.mutate(newFlight)} className="btn-primary flex-1" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create Flight'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
