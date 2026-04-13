import Link from 'next/link';

const bookFly = [
  { label: 'Search Flights', href: '/search/' },
  { label: 'Manage Booking', href: '/manage-booking/' },
  { label: 'Online Check-in', href: '/check-in/' },
  { label: 'Flight Status', href: '/flight-status/' },
] as const;

const support = [
  { label: 'Help Center', href: '/help-center/' },
  { label: 'Contact Us', href: '/contact/' },
  { label: 'Baggage', href: '/baggage/' },
  { label: 'Refunds', href: '/refunds/' },
] as const;

const linkClass =
  'text-slate-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60 rounded-sm transition-colors underline-offset-2 hover:underline';

export default function Footer() {
  return (
    <footer className="bg-[#1a3570] text-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 font-bold text-xl mb-4">
            <span className="text-yellow-400" aria-hidden>
              ✈
            </span>
            <span>Dhameys</span>
          </div>
          <p className="text-slate-200 text-sm leading-relaxed">
            Connecting the world with affordable, reliable flights across Middle East, Africa and Europe.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-white">Book & Fly</h4>
          <ul className="space-y-2.5 text-sm">
            {bookFly.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className={linkClass}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-white">Support</h4>
          <ul className="space-y-2.5 text-sm">
            {support.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className={linkClass}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-white">Contact</h4>
          <ul className="space-y-2.5 text-sm text-slate-200">
            <li>
              <a href="mailto:support@dhameys.com" className={linkClass}>
                support@dhameys.com
              </a>
            </li>
            <li>
              <a href="tel:+18003426397" className={linkClass}>
                +1-800-DHAMEYS
              </a>
            </li>
            <li className="text-slate-300 pt-1">24/7 support</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-300">
        © {new Date().getFullYear()} Dhameys Airlines. All rights reserved. ·{' '}
        <Link href="/privacy/" className={`${linkClass} inline`}>
          Privacy
        </Link>{' '}
        ·{' '}
        <Link href="/terms/" className={`${linkClass} inline`}>
          Terms
        </Link>
      </div>
    </footer>
  );
}
