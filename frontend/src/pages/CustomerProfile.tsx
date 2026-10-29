import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { api } from '../services/api';
import { User, Mail, Phone, MapPin, Globe, Save, Navigation, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CustomerProfile: React.FC = () => {
  const { user, updateUser, deleteAccount } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    latitude: user?.latitude ?? 12.9716,
    longitude: user?.longitude ?? 77.5946,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const reverseGeocodeLocation = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (!response.ok) return '';
      const data = await response.json();
      return (
        data?.address?.district ||
        data?.address?.city ||
        data?.address?.town ||
        data?.address?.village ||
        data?.address?.state ||
        data?.display_name ||
        ''
      );
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        latitude: user.latitude ?? 12.9716,
        longitude: user.longitude ?? 77.5946,
      });
    }
  }, [user]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage('GPS is not supported in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setForm((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));

        const autoLocation = await reverseGeocodeLocation(latitude, longitude);
        if (autoLocation) {
          setForm((prev) => ({
            ...prev,
            address: autoLocation,
            latitude,
            longitude,
          }));
        }

        setMessage('Current GPS location captured and location name updated. Save to update your profile.');
      },
      () => {
        setMessage('Unable to access GPS location. You can type your location manually.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.put('/auth/profile', {
        name: form.name,
        phone: form.phone,
        address: form.address,
        language,
        latitude: form.latitude,
        longitude: form.longitude,
      });
      updateUser(res.data.user);
      setMessage('Profile updated successfully.');
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your QuickMend profile and all associated data permanently? This cannot be undone.')) return;

    setSaving(true);
    setMessage(null);
    try {
      await deleteAccount();
      navigate('/');
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to delete profile.');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold text-2xl rounded-2xl flex items-center justify-center shadow-md">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{user?.name}</h1>
            <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
              {t('customerAccount')}
            </span>
          </div>
        </div>

        {message && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-800">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('fullName')}</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('phone')}</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('addressLocation')}</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder={t('locationPlaceholder')}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs"
            >
              <Navigation className="w-4 h-4" />
              {t('useMyGps')}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-xl font-bold text-xs shadow-md disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? t('savingProfile') : t('saveProfile')}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3 text-slate-700">
              <Globe className="w-4 h-4 text-slate-400" />
              <span>{t('appLanguage')}</span>
            </div>
            <LanguageSelector />
          </div>

          <div className="border-t border-rose-100 pt-5">
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl font-bold text-xs disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" />
              Delete my profile permanently
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
