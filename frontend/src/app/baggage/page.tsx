import SupportShell from '../../components/layout/SupportShell';

export default function BaggagePage() {
  return (
    <SupportShell
      title="Baggage"
      subtitle="Allowances below apply to Dhameys-operated flights unless your fare rules say otherwise."
    >
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Cabin baggage</h2>
        <p>
          Most economy fares include <strong className="text-gray-900">one cabin bag</strong> (typical max 7 kg) that must
          fit under the seat in front of you or in the overhead bin. Dimensions often follow a standard carry-on limit
          (check your booking confirmation for exact limits).
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Checked baggage</h2>
        <p>
          Checked allowances depend on route and fare. Many short-haul fares include{' '}
          <strong className="text-gray-900">one checked bag</strong> (often 23 kg). Higher cabins or add-ons may include
          extra pieces or weight.
        </p>
        <p className="text-gray-500 text-sm">
          Exact baggage for your ticket appears in your booking details and e-ticket after purchase.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Special items</h2>
        <p>
          Sports equipment, musical instruments, and medical devices may need advance notice. Contact{' '}
          <a href="mailto:support@dhameys.com" className="text-[#1a3570] font-medium hover:underline">
            support@dhameys.com
          </a>{' '}
          before travel with dimensions and weight.
        </p>
      </section>
    </SupportShell>
  );
}
