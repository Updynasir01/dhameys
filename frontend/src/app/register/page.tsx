'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/auth.store';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuthStore();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', gdprConsent: false });
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gdprConsent) { toast.error('Please accept the privacy policy'); return; }
    setLoading(true);
    try {
      await register({ ...form, gdprConsent: String(form.gdprConsent) });
      toast.success('Account created! Please verify your email.');
      router.push('/login');
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const upd = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-[#1a3570] mb-8"><span className="text-yellow-400">✈</span><span>Dhameys Airlines</span></Link>
        <h1 className="text-2xl font-bold mb-2">Create your account</h1>
        <p className="text-gray-500 text-sm mb-6">Join Dhameys Airlines and start earning loyalty points.</p>
        <form onSubmit={handle} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {['firstName','lastName'].map(f => (
              <div key={f}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f === 'firstName' ? 'First Name' : 'Last Name'}</label>
                <input value={(form as any)[f]} onChange={e => upd(f, e.target.value)} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1a3570] outline-none" />
              </div>
            ))}
          </div>
          {['email','phone','password'].map(f => (
            <div key={f}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.charAt(0).toUpperCase() + f.slice(1)}{f !== 'phone' ? '' : ' (optional)'}</label>
              <input type={f === 'password' ? 'password' : f === 'email' ? 'email' : 'tel'}
                value={(form as any)[f]} onChange={e => upd(f, e.target.value)} required={f !== 'phone'}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1a3570] outline-none" />
              {f === 'password' && <p className="text-xs text-gray-400 mt-1">Min 8 chars, one uppercase, one number</p>}
            </div>
          ))}
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={form.gdprConsent} onChange={e => upd('gdprConsent', e.target.checked)} className="mt-1 accent-[#1a3570]" />
            <span className="text-xs text-gray-600">I agree to the <Link href="/privacy" className="text-[#1a3570] hover:underline">Privacy Policy</Link> and consent to Dhameys processing my personal data for booking purposes.</span>
          </label>
          <button type="submit" disabled={loading}
            className="w-full bg-[#1a3570] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#1e4080] transition disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">Already have an account? <Link href="/login" className="text-[#1a3570] font-semibold hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}
