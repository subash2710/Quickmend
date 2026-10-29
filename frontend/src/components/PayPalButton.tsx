import React, { useState } from 'react';
import { api } from '../services/api';
import { CreditCard, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

interface PayPalButtonProps {
  bookingId: number;
  amount: number;
  onSuccess: () => void;
}

export const PayPalButton: React.FC<PayPalButtonProps> = ({ bookingId, amount, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const platformFee = Math.round(amount * 0.1 * 100) / 100;
  const providerPayout = Math.round((amount - platformFee) * 100) / 100;

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Create PayPal Order via backend
      const createRes = await api.post('/payments/create', { booking_id: bookingId });
      const orderData = createRes.data.order;

      if (!orderData || !orderData.order_id) {
        throw new Error('Failed to generate PayPal order');
      }

      // 2. Execute Payment Capture via backend
      const captureRes = await api.post('/payments/capture', {
        booking_id: bookingId,
        paypal_order_id: orderData.order_id,
      });

      if (captureRes.data.payment && captureRes.data.payment.payment_status === 'COMPLETED') {
        setCompleted(true);
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        throw new Error('Payment capture returned incomplete status');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.response?.data?.error || err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center gap-2 text-emerald-800 font-bold text-sm">
        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        <span>Payment Completed via PayPal Sandbox!</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
        <p className="mb-2 font-bold text-slate-800">Payment settlement preview</p>
        <div className="flex justify-between text-slate-600"><span>Customer pays</span><span className="font-bold">₹{amount.toFixed(2)}</span></div>
        <div className="flex justify-between text-indigo-600"><span>QuickMend commission (10%)</span><span className="font-bold">₹{platformFee.toFixed(2)}</span></div>
        <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-emerald-700"><span>Provider receives</span><span className="font-bold">₹{providerPayout.toFixed(2)}</span></div>
      </div>
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
          {error}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full py-3.5 px-6 bg-[#0070BA] hover:bg-[#005ea6] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing PayPal Sandbox Payment...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Pay ₹{amount.toFixed(2)} with PayPal Sandbox</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Secured by PayPal Sandbox. Backend verified transaction.</span>
      </div>
    </div>
  );
};
