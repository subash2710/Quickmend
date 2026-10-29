import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { api } from '../services/api';
import { Service } from '../types';
import { Wrench, CheckSquare, Square, Briefcase } from 'lucide-react';

export const ProviderRegisterPage: React.FC = () => {
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    experience_years: '3',
    skills: '',
    address: '',
    service_area: '',
    service_radius: '15',
    latitude: 12.9716,
    longitude: 77.5946,
  });

  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/services');
        setServices(res.data.services || []);
      } catch (err) {
        console.error('Failed to load services:', err);
      }
    };
    fetchServices();
  }, []);

  const toggleService = (id: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (selectedServiceIds.length === 0) {
      setError('Please select at least one service that you provide');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/register', {
        ...formData,
        role: 'PROVIDER',
        language,
        experience_years: parseInt(formData.experience_years),
        service_radius: parseFloat(formData.service_radius),
        selected_service_ids: selectedServiceIds,
        address: formData.address || formData.service_area,
        latitude: formData.latitude,
        longitude: formData.longitude,
      });

      login(res.data.token, res.data.user);
      navigate('/provider/dashboard');
    } catch (err: any) {
      console.error('Provider registration error:', err);
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100">
        <div className="flex justify-end">
          <LanguageSelector />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-3xl font-extrabold text-slate-900">{t('providerRegistration')}</h2>
          <p className="text-xs text-slate-500">{t('providerRegistrationSubtitle')}</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('fullName')}</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Arun Kumar"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('phoneNumber')}</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('email')}</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="arun@example.com"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('experienceYears')}</label>
              <input
                type="number"
                min="1"
                max="40"
                required
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('password')}</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('confirmPassword')}</label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('serviceAreaCity')}</label>
              <input
                type="text"
                required
                value={formData.service_area}
                onChange={(e) => setFormData({ ...formData, service_area: e.target.value, address: e.target.value })}
                placeholder={t('locationPlaceholder')}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('serviceRadiusKm')}</label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={formData.service_radius}
                onChange={(e) => setFormData({ ...formData, service_radius: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!navigator.geolocation) {
                setError('GPS is not supported in this browser.');
                return;
              }

              navigator.geolocation.getCurrentPosition(
                async (position) => {
                  const latitude = position.coords.latitude;
                  const longitude = position.coords.longitude;

                  setFormData((prev) => ({
                    ...prev,
                    latitude,
                    longitude,
                  }));

                  try {
                    const response = await fetch(
                      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                    );
                    if (response.ok) {
                      const data = await response.json();
                      const autoLocation =
                        data?.address?.district ||
                        data?.address?.city ||
                        data?.address?.town ||
                        data?.address?.village ||
                        data?.display_name ||
                        'Current location';

                      setFormData((prev) => ({
                        ...prev,
                        service_area: autoLocation,
                        address: autoLocation,
                      }));
                    }
                  } catch {
                    // ignore reverse geocoding errors and keep the GPS coordinates
                  }
                },
                () => setError('Unable to access GPS. Please enter your location manually.'),
                { enableHighAccuracy: true, timeout: 15000 }
              );
            }}
            className="w-full py-2.5 border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-xl"
          >
            {t('useCurrentGpsLocation')}
          </button>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Skills & Specialties</label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              placeholder="Wiring, MCB repair, Split AC servicing, Fan installation"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* MULTI-SERVICE SELECTION CHECKBOXES (SECTION 9) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-extrabold text-slate-900">{t('selectYourServices')}</label>
              <span className="text-xs text-indigo-600 font-semibold">
                {selectedServiceIds.length} {t('serviceSelectedCount')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((svc) => {
                const isSelected = selectedServiceIds.includes(svc.id);
                return (
                  <div
                    key={svc.id}
                    onClick={() => toggleService(svc.id)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-600 text-indigo-900 font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-indigo-300 text-slate-700'
                    }`}
                  >
                    <span className="text-xs sm:text-sm">{svc.name}</span>
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-extrabold text-base rounded-2xl shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? t('registeringProviderProfile') : t('completeProviderRegistration')}
          </button>
        </form>
      </div>
    </div>
  );
};
