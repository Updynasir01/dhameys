'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SearchForm from '../components/flight/SearchForm';

const popularRoutes = [
  { from: 'DXB', to: 'LHR', fromCity: 'Dubai', toCity: 'London', price: 'from $320' },
  { from: 'DXB', to: 'CAI', fromCity: 'Dubai', toCity: 'Cairo', price: 'from $120' },
  { from: 'DXB', to: 'BOM', fromCity: 'Dubai', toCity: 'Mumbai', price: 'from $110' },
  { from: 'DXB', to: 'LOS', fromCity: 'Dubai', toCity: 'Lagos', price: 'from $380' },
  { from: 'DXB', to: 'NBO', fromCity: 'Dubai', toCity: 'Nairobi', price: 'from $260' },
  { from: 'CAI', to: 'LHR', fromCity: 'Cairo', toCity: 'London', price: 'from $410' },
];

export default function HomePage() {
  const router = useRouter();
  const handleSearch = (params: URLSearchParams) => router.push(`/search?${params.toString()}`);

  const popularDepartureDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  })();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <section className="bg-gradient-to-br from-[#1a3570] via-[#1e4080] to-[#0f2558] text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-32">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm mb-6 border border-white/20">
              <span className="text-yellow-400">✈</span>
              <span>Dhameys Airlines — Connecting the World</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Fly to Your <span className="text-yellow-400">Dream Destination</span>
            </h1>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto">Book affordable flights across the Middle East, Africa, Europe and Asia.</p>
          </div>
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl p-4 md:p-6">
            <SearchForm onSearch={handleSearch} />
          </div>
        </div>
      </section>

      <section className="py-16 max-w-6xl mx-auto px-4 w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Popular Routes</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {popularRoutes.map((r) => (
            <Link key={`${r.from}-${r.to}`}
              href={`/search?origin=${r.from}&destination=${r.to}&departureDate=${popularDepartureDate}&adults=1&cabinClass=economy`}
              className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-2xl font-bold text-[#1a3570]">{r.from}</span>
                  <span className="text-gray-400 mx-2">→</span>
                  <span className="text-2xl font-bold text-[#1a3570]">{r.to}</span>
                </div>
                <span className="text-2xl group-hover:translate-x-1 transition-transform">✈️</span>
              </div>
              <p className="text-sm text-gray-500">{r.fromCity} → {r.toCity}</p>
              <p className="text-sm font-semibold text-blue-600 mt-1">{r.price}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">Why Fly with Dhameys?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: '🛫', title: 'Wide Network', desc: '28+ destinations worldwide' },
              { icon: '💰', title: 'Best Fares', desc: 'Guaranteed low fares, price match' },
              { icon: '🔒', title: 'Secure Booking', desc: 'PCI-DSS, 256-bit SSL encryption' },
              { icon: '⭐', title: 'Loyalty Rewards', desc: 'Earn & redeem points every flight' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
