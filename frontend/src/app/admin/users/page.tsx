'use client';
// src/app/admin/users/page.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../lib/api';
import Link from 'next/link';
import { Search, UserX, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ role: '', status: '', search: '', page: 1 });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn:  () => adminApi.listUsers({ ...filters, limit: 20 }).then(r => r.data.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateUserStatus(id, status),
    onSuccess: () => { toast.success('User status updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError:   () => toast.error('Update failed'),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        <Link href="/admin" className="hover:text-brand-600">Dashboard</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Users</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>

      <div className="card p-4 mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
            className="input-field pl-9 text-sm py-2" placeholder="Search name or email…" />
        </div>
        <select value={filters.role} onChange={e => setFilters(f => ({ ...f, role: e.target.value, page: 1 }))}
          className="input-field w-36 text-sm py-2">
          <option value="">All roles</option>
          {['customer','agent','admin','superadmin'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
          className="input-field w-40 text-sm py-2">
          <option value="">All statuses</option>
          {['active','inactive','suspended','pending_verification'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Loyalty', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && Array.from({length:8}).map((_,i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-5 bg-gray-100 rounded animate-pulse"/></td></tr>
              ))}
              {!isLoading && !data?.users?.length && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No users found</td></tr>
              )}
              {(data?.users || []).map((u: Record<string, unknown>) => {
                const uid = String(u.id ?? u._id ?? '');
                return (
                <tr key={uid} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{String(u.firstName ?? u.first_name ?? '')} {String(u.lastName ?? u.last_name ?? '')}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{String(u.email ?? '')}</td>
                  <td className="px-4 py-3">
                    <span className={{'admin':'badge-blue','superadmin':'badge-blue','agent':'badge-amber','customer':'badge-gray'}[String(u.role)] || 'badge-gray'}>
                      {String(u.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={{'active':'badge-green','suspended':'badge-red','inactive':'badge-gray','pending_verification':'badge-amber'}[String(u.status)] || 'badge-gray'}>
                      {String(u.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="font-medium">{Number(u.loyaltyPoints ?? u.loyalty_points ?? 0).toLocaleString()}</span>
                    <span className="text-xs text-gray-400 ml-1">{String(u.loyaltyTier ?? u.loyalty_tier ?? '')}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {(u.createdAt ?? u.created_at) ? new Date(String(u.createdAt ?? u.created_at)).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {u.status !== 'suspended' ? (
                        <button
                          onClick={() => { if (confirm(`Suspend ${u.email}?`)) statusMutation.mutate({ id: uid, status: 'suspended' }); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Suspend">
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => statusMutation.mutate({ id: uid, status: 'active' })}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Activate">
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
        {data?.total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>{data.total} total users</span>
            <div className="flex gap-2">
              <button disabled={filters.page <= 1} onClick={() => setFilters(f => ({...f, page: f.page-1}))} className="btn-ghost py-1 px-3 disabled:opacity-40">← Prev</button>
              <span>Page {filters.page}</span>
              <button disabled={filters.page * 20 >= data.total} onClick={() => setFilters(f => ({...f, page: f.page+1}))} className="btn-ghost py-1 px-3 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
