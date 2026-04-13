'use client';
// src/app/booking/payment/page.tsx
import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useBookingStore } from '../../../store/bookingStore';
import { useAuthStore } from '../../../store/auth.store';
import { bookingApi, paymentApi } from '../../../lib/api';
import { Shield, Lock, CreditCard, Loader2, FlaskConical } from 'lucide-react';
import toast from 'react-hot-toast';

const stripePk = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '';
const stripePromise = stripePk ? loadStripe(stripePk) : null;

type IntentPayload = {
  clientSecret: string | null;
  paymentIntentId: string;
  testMode?: boolean;
};

function StripeCardForm({
  amount,
  currency,
  confirmationRef,
  clientSecret,
}: {
  amount: number;
  currency: string;
  confirmationRef: string;
  clientSecret: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;
    setIsProcessing(true);

    const card = elements.getElement(CardElement);
    if (!card) {
      setIsProcessing(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });

    if (error) {
      toast.error(error.message || 'Payment failed');
      setIsProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      await paymentApi.confirm(paymentIntent.id).catch(() => {});
      toast.success('Payment successful! 🎉');
      router.push(`/my-bookings?paid=${encodeURIComponent(confirmationRef)}`);
    }
    setIsProcessing(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <CardElement
          options={{
            style: {
              base: { fontSize: '16px', color: '#1f2937', '::placeholder': { color: '#9ca3af' } },
              invalid: { color: '#dc2626' },
            },
          }}
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
        <Shield className="w-4 h-4 text-green-500 flex-shrink-0" />
        <span>Your payment is secured with 256-bit SSL encryption. We are PCI-DSS compliant.</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Processing…
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" /> Pay {currency} {amount.toFixed(2)}
          </>
        )}
      </button>
    </form>
  );
}

function PaymentMethodBlock({
  bookingId,
  amount,
  currency,
  confirmationRef,
}: {
  bookingId: string;
  amount: number;
  currency: string;
  confirmationRef: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [intent, setIntent] = useState<IntentPayload | null>(null);
  const [testSubmitting, setTestSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    paymentApi
      .createIntent(bookingId)
      .then((res) => {
        if (cancelled) return;
        const d = res.data.data;
        setIntent({
          clientSecret: d.clientSecret ?? null,
          paymentIntentId: d.paymentIntentId,
          testMode: d.testMode === true,
        });
      })
      .catch(() => {
        toast.error('Could not initiate payment');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  async function completeTestPayment() {
    if (!intent?.paymentIntentId) return;
    setTestSubmitting(true);
    try {
      await paymentApi.confirm(intent.paymentIntentId);
      toast.success('Test payment complete — booking confirmed!');
      router.push(`/my-bookings?paid=${encodeURIComponent(confirmationRef)}`);
    } catch {
      toast.error('Could not confirm test payment');
    } finally {
      setTestSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
        Preparing checkout…
      </div>
    );
  }

  if (intent?.testMode) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold flex items-center gap-2">
            <FlaskConical className="w-4 h-4 shrink-0" />
            Test mode (no Stripe)
          </p>
          <p className="mt-1 text-amber-800/90">
            Real cards are disabled. Use the button below to mark this booking as paid for local development only.
          </p>
        </div>
        <button
          type="button"
          disabled={testSubmitting}
          onClick={completeTestPayment}
          className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4 bg-emerald-700 hover:bg-emerald-800"
        >
          {testSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Confirming…
            </>
          ) : (
            <>
              <FlaskConical className="w-5 h-5" />
              Complete test payment — {currency} {amount.toFixed(2)}
            </>
          )}
        </button>
      </div>
    );
  }

  if (!intent?.clientSecret || !stripePromise) {
    return (
      <p className="text-sm text-red-600 py-4">
        Payment could not be initialized. Set{' '}
        <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_STRIPE_PUBLIC_KEY</code> or enable test mode on the
        server (<code className="bg-gray-100 px-1 rounded">PAYMENT_TEST_MODE=true</code>).
      </p>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <StripeCardForm
        amount={amount}
        currency={currency}
        confirmationRef={confirmationRef}
        clientSecret={intent.clientSecret}
      />
    </Elements>
  );
}

function PaymentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    selectedOutbound,
    selectedFare,
    passengers,
    contactEmail,
    contactPhone,
    promoCode,
    bookingRef,
    bookingId,
    setBookingRef,
    searchParams: storeSearch,
  } = useBookingStore();
  const { user } = useAuthStore();
  const [creating, setCreating] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState(bookingId || '');
  const [loadedTotal, setLoadedTotal] = useState<{ amount: number; currency: string } | null>(null);
  const createStarted = useRef(false);

  const refFromUrl = searchParams.get('ref')?.trim() || '';

  useEffect(() => {
    const bid = searchParams.get('bookingId')?.trim() || '';
    const pref = searchParams.get('ref')?.trim() || '';
    if (bid) {
      setCreatedBookingId(bid);
      if (pref) setBookingRef(pref, bid);
      setCreating(false);
      return;
    }
    if (bookingId) {
      setCreatedBookingId(bookingId);
      setCreating(false);
      return;
    }
    if (!selectedOutbound || !selectedFare || !passengers.length) {
      router.replace('/');
      return;
    }
    if (createStarted.current) return;
    createStarted.current = true;

    setCreating(true);
    const out = selectedOutbound as unknown as { id?: string; _id?: string };
    const fare = selectedFare as unknown as { id?: string; _id?: string; cabinClass?: string };
    bookingApi
      .create({
        tripType: storeSearch?.tripType || 'one_way',
        outboundFlightId: String(out.id ?? out._id ?? ''),
        cabinClass: fare.cabinClass || 'economy',
        fareRuleId: String(fare.id ?? fare._id ?? ''),
        passengers,
        contactEmail: contactEmail || user?.email || '',
        contactPhone: contactPhone || '',
        promoCode: promoCode || undefined,
      })
      .then((res) => {
        const b = res.data.data;
        const ref = b.bookingRef ?? b.booking_ref;
        const id = String(b._id ?? b.id);
        setBookingRef(ref, id);
        setCreatedBookingId(id);
      })
      .catch((err) => {
        createStarted.current = false;
        toast.error(err?.response?.data?.error || 'Booking failed');
        router.back();
      })
      .finally(() => setCreating(false));
  }, [
    searchParams,
    bookingId,
    selectedOutbound,
    selectedFare,
    passengers,
    contactEmail,
    contactPhone,
    promoCode,
    user?.email,
    router,
    setBookingRef,
    storeSearch?.tripType,
  ]);

  const effectiveRef = refFromUrl || bookingRef || '';

  useEffect(() => {
    if (!effectiveRef || selectedFare) return;
    bookingApi
      .get(effectiveRef)
      .then((r) => {
        const b = r.data.data;
        setLoadedTotal({
          amount: Number(b.totalAmount ?? 0),
          currency: String(b.currency || 'USD'),
        });
      })
      .catch(() => {});
  }, [effectiveRef, selectedFare]);

  const fareAmt = selectedFare as unknown as { totalPrice?: number; currency?: string; cabinClass?: string } | null;
  const amountFromFare = (fareAmt?.totalPrice || 0) * (passengers?.length || 1);
  const amount = loadedTotal?.amount ?? amountFromFare;
  const currency = loadedTotal?.currency ?? fareAmt?.currency ?? 'USD';

  if (creating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
        <p className="text-gray-500">Creating your booking…</p>
      </div>
    );
  }

  const confirmationRef = effectiveRef || createdBookingId;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h1>

      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>
              {passengers?.length ? `${passengers.length} × ` : ''}
              {fareAmt?.cabinClass?.replace('_', ' ') ?? 'Fare'}
            </span>
            <span>
              {currency} {amount.toFixed(2)}
            </span>
          </div>
          {promoCode && (
            <div className="flex justify-between text-green-600">
              <span>Promo ({promoCode})</span>
              <span>Applied ✓</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span className="text-brand-700 text-lg">
              {currency} {amount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-brand-600" />
          <h2 className="font-semibold text-gray-900">Payment</h2>
        </div>
        {createdBookingId ? (
          <PaymentMethodBlock
            bookingId={createdBookingId}
            amount={amount}
            currency={currency}
            confirmationRef={confirmationRef}
          />
        ) : (
          <div className="text-center py-6 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
          <p className="text-gray-500">Loading…</p>
        </div>
      }
    >
      <PaymentPageInner />
    </Suspense>
  );
}
