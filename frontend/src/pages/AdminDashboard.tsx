import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ShieldAlert, Users, Wrench, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">{t('loadingAdminPanel')}</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentBookings = data?.recent_bookings || [];
  const providers = data?.providers || [];
  const customers = data?.customers || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <ShieldAlert className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{t('adminControlPanel')}</h1>
          <p className="text-xs text-slate-500">{t('adminOverview')}</p>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">{t('customers')}</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total_customers || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">{t('providers')}</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total_providers || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">{t('totalBookings')}</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total_bookings || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">{t('services')}</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total_services || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm bg-indigo-50/50">
          <span className="text-xs font-bold text-indigo-700 uppercase">{t('customerPayments')}</span>
          <p className="text-2xl font-black text-indigo-700 mt-1">₹{(stats.total_revenue || 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">{t('paymentSettlement')}</h3>
          <p className="text-xs text-slate-500 mt-1">{t('paymentSettlementDescription')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-indigo-50 p-4">
            <span className="text-xs font-bold uppercase text-indigo-700">{t('platformCommission')}</span>
            <p className="mt-1 text-2xl font-black text-indigo-700">₹{(stats.total_platform_commission || 0).toFixed(2)}</p>
            <p className="text-xs text-indigo-600">{stats.commission_rate || 10}% {t('perCompletedPayment')}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4">
            <span className="text-xs font-bold uppercase text-emerald-700">{t('providerPayouts')}</span>
            <p className="mt-1 text-2xl font-black text-emerald-700">₹{(stats.total_provider_payout || 0).toFixed(2)}</p>
            <p className="text-xs text-emerald-600">{t('afterCommission')}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <span className="text-xs font-bold uppercase text-slate-600">{t('customerPayments')}</span>
            <p className="mt-1 text-2xl font-black text-slate-900">₹{(stats.total_revenue || 0).toFixed(2)}</p>
            <p className="text-xs text-slate-500">{t('verifiedPayments')}</p>
          </div>
        </div>
      </div>

      {/* TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Providers Table */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-4">
          <h3 className="font-bold text-slate-900 text-base">{t('registeredProviders')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-3">{t('name')}</th>
                  <th className="p-3">{t('dutyStatus')}</th>
                  <th className="p-3">{t('rating')}</th>
                  <th className="p-3">{t('jobs')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {providers.map((p: any) => (
                  <tr key={p.id}>
                    <td className="p-3 font-semibold">{p.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold ${p.duty_status === 'ON_DUTY' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {p.duty_status}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-amber-600">⭐ {p.rating}</td>
                    <td className="p-3 font-bold">{p.completed_jobs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-4">
          <h3 className="font-bold text-slate-900 text-base">{t('recentBookings')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-3">{t('id')}</th>
                  <th className="p-3">{t('service')}</th>
                  <th className="p-3">{t('status')}</th>
                  <th className="p-3">{t('amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBookings.map((b: any) => (
                  <tr key={b.id}>
                    <td className="p-3 font-bold">#{b.id}</td>
                    <td className="p-3 font-semibold">{b.service_name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-bold bg-sky-100 text-sky-800">
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 font-bold">₹{b.total_amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">{t('registeredCustomers')}</h3>
          <span className="text-xs font-semibold text-slate-400">{customers.length} {t('shown')}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b text-slate-500 font-bold uppercase">
              <tr>
                <th className="p-3">{t('name')}</th>
                <th className="p-3">{t('email')}</th>
                <th className="p-3">{t('phone')}</th>
                <th className="p-3">{t('address')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((customer: any) => (
                <tr key={customer.id}>
                  <td className="p-3 font-semibold">{customer.name}</td>
                  <td className="p-3 text-slate-600">{customer.email}</td>
                  <td className="p-3 text-slate-600">{customer.phone || '—'}</td>
                  <td className="p-3 text-slate-600">{customer.address || '—'}</td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-slate-400">{t('noCustomers')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
