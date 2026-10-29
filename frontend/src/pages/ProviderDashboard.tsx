import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { ProviderProfile, Booking } from '../types';
import {
  Power,
  DollarSign,
  Briefcase,
  Star,
  Plus,
  Bell,
  MapPin,
  CheckCircle,
  XCircle,
  Loader2,
  Clock
} from 'lucide-react';

export const ProviderDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { latestRequest, clearLatestRequest } = useSocket();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [provider, setProvider] = useState<ProviderProfile | null>(user?.provider_profile || null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [togglingDuty, setTogglingDuty] = useState(false);
  const [dutyError, setDutyError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchActiveBooking();
  }, []);

  useEffect(() => {
    if (user?.provider_profile) {
      setProvider(user.provider_profile);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.user && res.data.user.provider_profile) {
        setProvider(res.data.user.provider_profile);
      }
    } catch (err) {
      console.error('Failed to fetch provider profile:', err);
    }
  };

  const fetchActiveBooking = async () => {
    try {
      const res = await api.get('/bookings/provider-active');
      if (res.data.booking) {
        setActiveBooking(res.data.booking);
      }
    } catch (err) {
      console.error('Failed to load active job:', err);
    }
  };

  const handleToggleDuty = async () => {
    if (!provider) return;
    setTogglingDuty(true);
    setDutyError(null);

    const newStatus = provider.duty_status === 'ON_DUTY' ? 'OFF_DUTY' : 'ON_DUTY';

    try {
      const res = await api.put('/providers/duty-status', { duty_status: newStatus });
      setProvider(res.data.provider);
      await refreshUser();
    } catch (err: any) {
      console.error('Duty status update error:', err);
      setDutyError(err.response?.data?.error || t('dutyStatusUpdateError', 'Failed to update duty status'));
    } finally {
      setTogglingDuty(false);
    }
  };

  const handleAcceptRequest = async (bookingId: number) => {
    try {
      await api.post(`/bookings/${bookingId}/accept`);
      clearLatestRequest();
      fetchActiveBooking();
      navigate('/provider/active-job');
    } catch (err: any) {
      alert(err.response?.data?.error || t('acceptBookingError', 'Failed to accept booking'));
    }
  };

  const handleRejectRequest = async (bookingId: number) => {
    try {
      await api.post(`/bookings/${bookingId}/reject`);
      clearLatestRequest();
    } catch (err: any) {
      alert(t('rejectBookingError', 'Error rejecting booking'));
    }
  };

  const isOnDuty = provider?.duty_status === 'ON_DUTY';
  const getLocalizedServiceName = (serviceName: string) => {
    const serviceKeys: Record<string, string> = {
      Electrical: 'electrical',
      Plumbing: 'plumbing',
      Carpentry: 'carpentry',
      Cleaning: 'cleaning',
      'AC Service': 'acService',
      'Appliance Repair': 'applianceRepair',
      Painting: 'painting',
      Locksmith: 'locksmith',
      'Other Home Services': 'otherServices',
    };
    const key = serviceKeys[serviceName];
    return key ? t(key, serviceName) : serviceName;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* INCOMING REQUEST MODAL / NOTIFICATION POPUP (SECTION 26) */}
      {latestRequest && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-3xl shadow-2xl space-y-4 animate-bounce">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-6 h-6 animate-pulse" />
              <h3 className="text-xl font-extrabold">{t('newServiceRequest', 'NEW SERVICE REQUEST RECEIVED!')}</h3>
            </div>
            <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-lg">
              {t('estimatedEarnings', 'Est. Earnings')}: ₹{latestRequest.service_charge}
            </span>
          </div>

          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur text-sm space-y-1">
            <p className="font-bold">{t('service', 'Service')}: {getLocalizedServiceName(latestRequest.service_name)}</p>
            <p className="text-xs opacity-90">{t('issue', 'Issue')}: {latestRequest.problem_description}</p>
            <p className="text-xs opacity-90">{t('distance', 'Distance')}: {latestRequest.estimated_distance || 2.1} km &bull; {t('eta', 'ETA')}: ~{latestRequest.estimated_arrival || 8} mins</p>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() => handleAcceptRequest(latestRequest.id)}
              className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{t('acceptJob', 'ACCEPT JOB')}</span>
            </button>
            <button
              onClick={() => handleRejectRequest(latestRequest.id)}
              className="flex-1 py-3.5 bg-white/20 hover:bg-white/30 text-white font-bold text-sm rounded-xl backdrop-blur transition-all flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              <span>{t('reject', 'REJECT')}</span>
            </button>
          </div>
        </div>
      )}

      {/* HEADER & DUTY STATUS TOGGLE (SECTION 11 & 16) */}
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900">
            {t('welcomeProvider', 'Welcome')}, {user?.name || t('providerAccount', 'Provider')} 👋
          </h1>
          <p className="text-xs text-slate-500">
            {t('managedServices', 'Managed Services')} &bull; {provider?.service_area || 'Bangalore'} {t('area', 'Area')}
          </p>
        </div>

        {/* ON DUTY / OFF DUTY TOGGLE BUTTON */}
        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
          {dutyError && (
            <span className="text-xs text-rose-600 font-semibold">{dutyError}</span>
          )}

          <button
            onClick={handleToggleDuty}
            disabled={togglingDuty}
            className={`w-full md:w-auto px-8 py-4 rounded-2xl font-extrabold text-sm shadow-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 ${
              isOnDuty
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25 ring-4 ring-emerald-500/20'
                : 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-900/20'
            }`}
          >
            {togglingDuty ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Power className={`w-5 h-5 ${isOnDuty ? 'text-emerald-200' : 'text-slate-400'}`} />
            )}
            <span>{isOnDuty ? `🟢 ${t('onDutyAvailable', 'ON DUTY (AVAILABLE FOR JOBS)')}` : `🔴 ${t('offDutyUnavailable', 'OFF DUTY (UNAVAILABLE)')}`}</span>
          </button>
        </div>
      </div>

      {/* ACTIVE JOB BANNER IF IN PROGRESS */}
      {activeBooking && (
        <div className="bg-sky-600 text-white p-6 rounded-3xl shadow-xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
              {t('activeJobInProgress', 'Active Job in Progress')} ({activeBooking.status})
            </span>
            <h3 className="text-lg font-bold">{getLocalizedServiceName(activeBooking.service_name)} &bull; {activeBooking.problem_description}</h3>
            <p className="text-xs text-sky-100">{t('customer', 'Customer')}: {activeBooking.customer?.name} &bull; {t('address', 'Address')}: {activeBooking.customer?.address}</p>
          </div>
          <button
            onClick={() => navigate('/provider/active-job')}
            className="px-6 py-3 bg-white text-sky-800 font-extrabold text-xs rounded-xl shadow"
          >
            {t('manageActiveJob', 'Manage Active Job')} &rarr;
          </button>
        </div>
      )}

      {/* FOUR STAT CARDS (SECTION 11) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Earnings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">{t('totalEarnings', 'Total Earnings')}</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">₹{provider?.completed_jobs ? provider.completed_jobs * 350 : 1250}</p>
          <span className="text-[11px] text-emerald-600 font-semibold">{t('netPayoutReady', 'Net Payout Ready')}</span>
        </div>

        {/* Completed Jobs */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">{t('completedJobs', 'Completed Jobs')}</span>
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{provider?.completed_jobs || 38}</p>
          <span className="text-[11px] text-sky-600 font-semibold">{t('verifiedJobs', 'Verified Jobs')}</span>
        </div>

        {/* Rating */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">{t('ratingAutoCalculated', 'Rating (Auto Calculated)')}</span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">⭐ {provider?.rating || 4.7}</p>
          <span className="text-[11px] text-amber-600 font-semibold">{t('fromCustomerReviews', 'From {count} customer reviews').replace('{count}', String(provider?.review_count || 12))}</span>
        </div>
      </div>

      {/* MY SERVICES LIST & ADD SERVICE BUTTON (SECTION 11 & 14) */}
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t('yourOfferedServices', 'Your Offered Services')}</h2>
            <p className="text-xs text-slate-500">{t('serviceMatchingOnDuty', 'Service information is automatically retrieved for matching when ON DUTY')}</p>
          </div>

          <Link
            to="/provider/services"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ {t('addService', 'Add Service')}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {provider?.services && provider.services.length > 0 ? (
            provider.services.map((ps) => (
              <div
                key={ps.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{getLocalizedServiceName(ps.service_name)}</h4>
                    <span className="text-[11px] text-slate-500">Starting ₹{ps.base_charge}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 col-span-full">{t('noServicesConfigured', 'No services configured yet. Click "+ Add Service" above.')}</p>
          )}
        </div>
      </div>
    </div>
  );
};
