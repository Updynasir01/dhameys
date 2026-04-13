import SupportShell from '../../components/layout/SupportShell';

export default function ContactPage() {
  return (
    <SupportShell
      title="Contact us"
      subtitle="We are here 24 hours a day, seven days a week."
    >
      <p>
        <strong className="text-gray-900">Email</strong>
        <br />
        <a href="mailto:support@dhameys.com" className="text-[#1a3570] font-medium hover:underline">
          support@dhameys.com
        </a>
      </p>
      <p>
        <strong className="text-gray-900">Phone</strong>
        <br />
        <a href="tel:+18003426397" className="text-[#1a3570] font-medium hover:underline">
          +1-800-DHAMEYS
        </a>
        <span className="text-gray-500"> (international rates may apply)</span>
      </p>
      <p>
        <strong className="text-gray-900">Response time</strong>
        <br />
        We aim to reply to emails within one business day. For urgent changes to a booking already made, include your
        booking reference in the subject line.
      </p>
    </SupportShell>
  );
}
