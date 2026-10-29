import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Booking } from '../types';
import { Navigation, MapPin, CheckCircle, Clock, Phone, AlertCircle, Loader2, XCircle } from 'lucide-react';

export const ProviderActiveJobPage: React.FC = () => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [additionalCharge, setAdditionalCharge] = useState<string>('0');

  useEffect(() => {
    fetchActiveBooking();
  }, []);

  const fetchActiveBooking = async () => {
    try {
      const res = await api.get('/bookings/provider-active');
      setBooking(res.data.booking);
    } catch (err) {
      console.error('Failed to load active job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (endpoint: string, payload = {}) => {
    if (!booking) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/bookings/${booking.id}/${endpoint}`, payload);
      setBooking(res.data.booking);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking || !window.confirm('Cancel this booking for the customer?')) return;

    setActionLoading(true);
    try {
      await api.post(`/bookings/${booking.id}/provider-cancel`);
      setBooking(null);
    } catch (err: any) {
      window.alert(err.response?.data?.error || 'Failed to cancel booking.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Loading Active Job details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-3">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">No Active Job Currently</h2>
        <p className="text-xs text-slate-500">
          When you accept a new booking while ON DUTY, job navigation & customer details will appear here.
        </p>
      </div>
    );
  }

  const customer = booking.customer;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* HEADER CARD */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest">Active Dispatch #{booking.id}</span>
            <h1 className="text-2xl font-extrabold text-slate-900">{booking.service_name} Service</h1>
            <p className="text-xs text-slate-500">{booking.problem_description}</p>
          </div>

          <span className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs rounded-xl">
            Status: {booking.status}
          </span>
        </div>

        {/* CUSTOMER DETAILS (SECTION 33) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Customer</span>
            <span className="font-extrabold text-slate-900 text-base">{customer?.name || 'Rahul'}</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Distance</span>
            <span className="font-extrabold text-indigo-600 text-base">{booking.estimated_distance || 2.1} km</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Phone</span>
            <span className="font-extrabold text-slate-900 text-base">{customer?.phone || '+91 9876543210'}</span>
          </div>
        </div>

        {/* WORKFLOW ACTION BUTTONS (SECTION 33) */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Job Action Lifecycle</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {booking.status === 'PROVIDER_ACCEPTED' && (
              <button
                onClick={() => handleStatusChange('on-the-way')}
                disabled={actionLoading}
                className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all"
              >
                🛵 On the way
              </button>
            )}

            {['PROVIDER_ACCEPTED', 'PROVIDER_ON_THE_WAY'].includes(booking.status) && (
              <button
                onClick={() => handleStatusChange('arrived')}
                disabled={actionLoading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all"
              >
                📍 Arrived at Customer Location
              </button>
            )}

            {booking.status === 'PROVIDER_ARRIVED' && (
              <button
                onClick={() => handleStatusChange('start')}
                disabled={actionLoading}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all"
              >
                🔧 Start Service Work
              </button>
            )}
          </div>

          {['PROVIDER_ASSIGNED', 'PROVIDER_ACCEPTED', 'PROVIDER_ON_THE_WAY', 'PROVIDER_ARRIVED'].includes(booking.status) && (
            <button
              onClick={handleCancelBooking}
              disabled={actionLoading}
              className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-sm rounded-xl transition-all disabled:opacity-60"
            >
              <XCircle className="inline-block w-4 h-4 mr-2" />
              {actionLoading ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          )}

          {/* SERVICE COMPLETION BOX */}
          {booking.status === 'SERVICE_STARTED' && (
            <div className="p-5 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-4">
              <h4 className="font-bold text-emerald-900 text-sm">Service Work in Progress</h4>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Hardware / Parts Charge (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={additionalCharge}
                  onChange={(e) => setAdditionalCharge(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <button
                onClick={() =>
                  handleStatusChange('complete', {
                    additional_charge: parseFloat(additionalCharge) || 0,
                  })
                }
                disabled={actionLoading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all"
              >
                ✅ Complete Service & Generate Bill
              </button>
            </div>
          )}

          {['PAYMENT_PENDING', 'PAYMENT_COMPLETED'].includes(booking.status) && (
            <div className="p-4 bg-slate-50 border rounded-xl text-xs text-slate-600">
              <p className="font-bold text-slate-800">Job Complete &bull; Bill Amount: ₹{booking.total_amount}</p>
              <p>Waiting for customer PayPal Sandbox payment verification.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
