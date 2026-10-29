import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Booking } from '../types';
import { Calendar, Clock, MapPin, CheckCircle, AlertTriangle, ArrowRight, XCircle } from 'lucide-react';

export const CustomerBookings: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings');
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Cancel this booking?')) return;

    setCancellingId(bookingId);
    try {
      const res = await api.post(`/bookings/${bookingId}/cancel`);
      setBookings((current) => current.map((booking) => (
        booking.id === bookingId ? res.data.booking : booking
      )));
    } catch (err: any) {
      window.alert(err.response?.data?.error || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">My Service Bookings</h1>
        <p className="text-xs text-slate-500">Track current jobs and review past home service history</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-slate-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Bookings Found</h3>
          <p className="text-xs text-slate-500">You haven't requested any home services yet.</p>
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="px-6 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md"
          >
            Book a Service Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-sky-600">Booking #{b.id}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-full text-slate-700">
                    {b.status}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {b.service_name} &bull; ₹{b.total_amount.toFixed(2)}
                </h3>
                <p className="text-xs text-slate-500">{b.problem_description}</p>
                <p className="text-[11px] text-slate-400">
                  Provider: {b.provider?.name || 'Assigned Technician'} &bull; Date: {b.created_at?.split('T')[0]}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={() => navigate(`/customer/track?booking_id=${b.id}`)}
                  className="px-4 py-2 bg-sky-50 text-sky-700 font-bold text-xs rounded-xl hover:bg-sky-100 transition-colors flex items-center gap-1"
                >
                  <span>Details / Track</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                {['SEARCHING_PROVIDER', 'PROVIDER_ASSIGNED', 'PROVIDER_ACCEPTED', 'PROVIDER_ON_THE_WAY', 'PROVIDER_ARRIVED'].includes(b.status) && (
                  <button
                    onClick={() => handleCancelBooking(b.id)}
                    disabled={cancellingId === b.id}
                    className="px-4 py-2 bg-rose-50 text-rose-700 font-bold text-xs rounded-xl hover:bg-rose-100 transition-colors flex items-center gap-1 disabled:opacity-60"
                  >
                    <XCircle className="w-4 h-4" />
                    {cancellingId === b.id ? 'Cancelling...' : 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
