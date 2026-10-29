import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Booking } from '../types';
import { CreditCard, CheckCircle, Clock } from 'lucide-react';

export const CustomerPayments: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/bookings');
      const all: Booking[] = res.data.bookings || [];
      setBookings(all.filter((b) => ['PAYMENT_PENDING', 'PAYMENT_COMPLETED'].includes(b.status)));
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Payment History & Receipts</h1>
        <p className="text-xs text-slate-500">Verified PayPal Sandbox transactions and billing statements</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-24 bg-slate-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 space-y-2">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Payments Recorded</h3>
          <p className="text-xs text-slate-500">Completed payments will appear here after service fulfillment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-sky-600">Booking #{b.id}</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      b.status === 'PAYMENT_COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{b.service_name} Service</h3>
                <p className="text-xs text-slate-500">
                  Technician: {b.provider?.name || 'Provider'} &bull; Date: {b.completed_at?.split('T')[0] || b.created_at?.split('T')[0]}
                </p>
              </div>

              <div className="text-right self-end sm:self-center">
                <span className="text-xl font-black text-slate-900 block">₹{b.total_amount.toFixed(2)}</span>
                <span className="text-[10px] font-semibold text-slate-400">Via PayPal Sandbox</span>
              </div>
              {b.status === 'PAYMENT_COMPLETED' && (
                <div className="w-full sm:w-auto rounded-xl bg-slate-50 p-3 text-[11px] sm:min-w-56">
                  <div className="flex justify-between text-slate-500"><span>QuickMend commission (10%)</span><span>₹{(b.total_amount * 0.1).toFixed(2)}</span></div>
                  <div className="mt-1 flex justify-between font-bold text-emerald-700"><span>Provider payout (90%)</span><span>₹{(b.total_amount * 0.9).toFixed(2)}</span></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
