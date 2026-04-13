'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/auth.store';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const router = useRouter();
  const handleLogout = async () => { await logout(); router.push('/'); };

  return (
    <nav className="bg-[#1a3570] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-yellow-400">✈</span><span>Dhameys</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/search" className="hover:text-yellow-300">Flights</Link>
            <Link href="/manage-booking" className="hover:text-yellow-300">Manage Booking</Link>
            <Link href="/check-in" className="hover:text-yellow-300">Check In</Link>
            {isAuthenticated && <Link href="/my-bookings" className="hover:text-yellow-300">My Bookings</Link>}
          </div>
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button onClick={() => setUserOpen(!userOpen)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm">
                  <span className="w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center text-[#1a3570] font-bold text-xs">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                  <span>{user?.firstName}</span>
                  <span className="text-xs opacity-60">▼</span>
                </button>
                {userOpen && (
                  <div className="absolute right-0 top-12 bg-white text-gray-800 rounded-xl shadow-xl border w-52 overflow-hidden z-50">
                    <Link href="/profile"    className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm">👤 My Profile</Link>
                    <Link href="/my-bookings" className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm">🎫 My Bookings</Link>
                    <Link href="/loyalty"    className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm">⭐ Loyalty</Link>
                    {(user?.role === 'admin' || user?.role === 'superadmin') && <Link href="/admin" className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm border-t">🔧 Admin</Link>}
                    <hr />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-sm text-red-600 text-left">🚪 Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-sm hover:text-yellow-300">Log In</Link>
                <Link href="/register" className="bg-yellow-400 text-[#1a3570] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-300">Sign Up</Link>
              </>
            )}
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? '✕' : '☰'}</button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-white/20 py-4 space-y-3 text-sm">
            <Link href="/search" className="block hover:text-yellow-300">Flights</Link>
            <Link href="/manage-booking" className="block hover:text-yellow-300">Manage Booking</Link>
            <Link href="/check-in" className="block hover:text-yellow-300">Check In</Link>
            {isAuthenticated
              ? <button onClick={handleLogout} className="block text-red-300">Logout</button>
              : <div className="flex gap-3 pt-2">
                  <Link href="/login" className="bg-white/10 px-4 py-2 rounded-lg">Log In</Link>
                  <Link href="/register" className="bg-yellow-400 text-[#1a3570] px-4 py-2 rounded-lg font-semibold">Sign Up</Link>
                </div>}
          </div>
        )}
      </div>
    </nav>
  );
}
