import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Booking } from '../types';
import { DollarSign, Shield, ArrowDownRight, TrendingUp } from 'lucide-react';

export const ProviderEarningsPage: React.FC = () => {
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const res = await api.get('/bookings');
      const all: Booking[] = res.data.bookings || [];
      setCompletedBookings(all.filter((b) => b.status === 'PAYMENT_COMPLETED'));
    } catch (err) {
      console.error('Failed to load earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalGross = completedBookings.reduce((sum, b) => sum + b.total_amount, 0);
  const totalFee = totalGross * 0.10; // 10% platform fee
  const totalNet = totalGross - totalFee;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Provider Earnings Breakdown</h1>
        <p className="text-xs text-slate-500">Gross revenue, platform commission (10%), and net earnings payout</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md">
          <span className="text-xs font-bold text-slate-400 uppercase">Gross Revenue</span>
          <p className="text-3xl font-black text-slate-900 mt-1">₹{totalGross.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md">
          <span className="text-xs font-bold text-slate-400 uppercase">Platform Fee (10%)</span>
          <p className="text-3xl font-black text-rose-600 mt-1">-₹{totalFee.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md bg-emerald-50/50">
          <span className="text-xs font-bold text-emerald-700 uppercase">Net Provider Takehome</span>
          <p className="text-3xl font-black text-emerald-600 mt-1">₹{totalNet.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Completed Job Earnings</h3>
        {completedBookings.length === 0 ? (
          <p className="text-xs text-slate-400">No completed earnings records yet.</p>
        ) : (
          <div className="space-y-3">
            {completedBookings.map((b) => {
              const gross = b.total_amount;
              const fee = gross * 0.10;
              const net = gross - fee;

              return (
                <div key={b.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800">Booking #{b.id} &bull; {b.service_name}</span>
                    <p className="text-slate-500">Customer: {b.customer?.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 block text-sm">Net: ₹{net.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400">Gross ₹{gross.toFixed(2)} (-10% Fee)</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
