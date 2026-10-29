import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Booking } from '../types';
import { Briefcase, Calendar, CheckCircle } from 'lucide-react';

export const ProviderHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/bookings');
      setHistory(res.data.bookings || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Job History</h1>
        <p className="text-xs text-slate-500">Record of all completed and past dispatch requests</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Job History Yet</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((b) => (
            <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-slate-900 text-sm">#{b.id} &bull; {b.service_name}</span>
                <p className="text-slate-500 mt-0.5">{b.problem_description}</p>
                <p className="text-slate-400 mt-0.5">Customer: {b.customer?.name} &bull; Status: {b.status}</p>
              </div>
              <span className="font-extrabold text-slate-900 text-sm">₹{b.total_amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
