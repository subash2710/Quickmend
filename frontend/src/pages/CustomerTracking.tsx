import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Booking } from '../types';
import { MapView } from '../components/MapView';
import { PayPalButton } from '../components/PayPalButton';
import { RatingModal } from '../components/RatingModal';
import {
  Wrench,
  Star,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle,
  Loader2,
  AlertCircle,
  XCircle
} from 'lucide-react';

export const CustomerTracking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const bookingIdParam = searchParams.get('booking_id');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchBookingDetail();
  }, [bookingIdParam]);

  useEffect(() => {
    if (!socket || !booking?.id) return;

    socket.emit('join_booking_room', { booking_id: booking.id });

    const handleBookingUpdate = (data: { booking: Booking }) => {
      if (data.booking && data.booking.id === booking.id) {
        setBooking(data.booking);
      }
    };

    socket.on('booking_updated', handleBookingUpdate);
    socket.on('booking_accepted', handleBookingUpdate);

    return () => {
      socket.off('booking_updated', handleBookingUpdate);
      socket.off('booking_accepted', handleBookingUpdate);
    };
  }, [socket, booking?.id]);

  const fetchBookingDetail = async () => {
    try {
      if (bookingIdParam) {
        const res = await api.get(`/bookings/${bookingIdParam}`);
        setBooking(res.data.booking);
      } else {
        const res = await api.get('/bookings');
        const bookings: Booking[] = res.data.bookings || [];
        if (bookings.length > 0) {
          setBooking(bookings[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load tracking details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking || !window.confirm('Cancel this booking?')) return;

    setCancelling(true);
    try {
      const res = await api.post(`/bookings/${booking.id}/cancel`);
      setBooking(res.data.booking);
    } catch (err: any) {
      window.alert(err.response?.data?.error || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Retrieving Provider & Booking details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">No Active Booking Found</h2>
        <p className="text-xs text-slate-500">You don't have any ongoing bookings to track at the moment.</p>
        <button
          onClick={() => navigate('/customer/dashboard')}
          className="px-6 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const provider = booking.provider;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER STATUS BADGE */}
      <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">Live Booking #{booking.id}</span>
          <h1 className="text-2xl font-extrabold text-slate-900">{booking.service_name} Request</h1>
          <p className="text-xs text-slate-500 mt-1">{booking.problem_description}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-sky-50 border border-sky-200 text-sky-700 font-extrabold text-xs rounded-xl flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-sky-500 rounded-full animate-ping"></span>
            <span>Status: {booking.status}</span>
          </span>
          {['SEARCHING_PROVIDER', 'PROVIDER_ASSIGNED', 'PROVIDER_ACCEPTED', 'PROVIDER_ON_THE_WAY', 'PROVIDER_ARRIVED'].includes(booking.status) && (
            <button
              onClick={handleCancelBooking}
              disabled={cancelling}
              className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 font-extrabold text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-60"
            >
              <XCircle className="w-4 h-4" />
              {cancelling ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MAP TRACKING CANVAS (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          <MapView
            customerLat={booking.customer_latitude}
            customerLng={booking.customer_longitude}
            providerLat={booking.provider_latitude}
            providerLng={booking.provider_longitude}
            providerName={provider?.name || 'Provider'}
            etaMinutes={booking.estimated_arrival || 8}
            bookingId={booking.id}
          />

          {/* PAYPAL SANDBOX PAYMENT SECTION (WHEN SERVICE_COMPLETED OR PAYMENT_PENDING) */}
          {['SERVICE_COMPLETED', 'PAYMENT_PENDING'].includes(booking.status) && (
            <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-sky-500 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Service Completed &bull; Bill Payment</h3>
                  <p className="text-xs text-slate-500">Complete payment via PayPal Sandbox</p>
                </div>
                <span className="text-2xl font-black text-sky-700">₹{booking.total_amount.toFixed(2)}</span>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Base Service Charge:</span>
                  <span className="font-semibold">₹{booking.service_charge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Additional Hardware/Labor:</span>
                  <span className="font-semibold">₹{booking.additional_charge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-bold text-slate-900 text-sm">
                  <span>Total Amount Due:</span>
                  <span>₹{booking.total_amount.toFixed(2)}</span>
                </div>
              </div>

              <PayPalButton
                bookingId={booking.id}
                amount={booking.total_amount}
                onSuccess={() => {
                  fetchBookingDetail();
                  setShowRatingModal(true);
                }}
              />
            </div>
          )}

          {/* PAYMENT COMPLETED CONFIRMATION & RATING PROMPT */}
          {booking.status === 'PAYMENT_COMPLETED' && (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-base">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                <span>Payment Received & Verified!</span>
              </div>
              <p className="text-xs text-emerald-700">
                Thank you for using QuickMend. Your booking has been completed successfully.
              </p>
              {!booking.review && (
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                >
                  ⭐ Rate & Review Provider
                </button>
              )}
            </div>
          )}
        </div>

        {/* AUTOMATICALLY RETRIEVED PROVIDER INFORMATION CARD (SECTION 30 & 55) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 space-y-6">
            <div className="text-center space-y-2 pb-4 border-b border-slate-100">
              <div className="w-20 h-20 bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-2xl rounded-full flex items-center justify-center mx-auto shadow-md">
                {provider?.name ? provider.name.charAt(0) : 'P'}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">{provider?.name || 'Assigned Technician'}</h3>
                <p className="text-xs font-semibold text-sky-600">{booking.service_name} Specialist</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-center gap-1 text-amber-500 font-extrabold text-base">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{provider?.rating || 5.0}</span>
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Rating</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="block font-extrabold text-slate-800 text-base">
                  {provider?.completed_jobs || 0}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Jobs Done</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Experience:</span>
                <span className="font-bold text-slate-800">{provider?.experience_years || 5} Years</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Phone:</span>
                <span className="font-bold text-slate-800">{provider?.phone || '+91 9876543210'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-medium">ETA:</span>
                <span className="font-bold text-emerald-600">~{booking.estimated_arrival || 8} Mins</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-400 font-medium">Skills:</span>
                <span className="font-bold text-slate-800 text-right max-w-[160px] truncate">
                  {provider?.skills || 'Professional Technician'}
                </span>
              </div>
            </div>

            <a
              href={`tel:${provider?.phone || '+919876543210'}`}
              className="w-full py-3 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Call Provider Directly</span>
            </a>
          </div>
        </div>
      </div>

      {/* RATING MODAL */}
      <RatingModal
        bookingId={booking.id}
        providerName={provider?.name || 'Provider'}
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmitted={() => fetchBookingDetail()}
      />
    </div>
  );
};
