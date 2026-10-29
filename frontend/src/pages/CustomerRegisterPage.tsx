import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { api } from '../services/api';
import { User, Mail, Lock, Phone, MapPin, Globe } from 'lucide-react';

export const CustomerRegisterPage: React.FC = () => {
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('role')?.toUpperCase() === 'PROVIDER') {
      navigate('/register-provider', { replace: true });
    }
  }, [navigate, searchParams]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    latitude: 12.9716,
    longitude: 77.5946,
    language,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/register', {
        ...formData,
        role: 'CUSTOMER',
        language,
        latitude: formData.latitude,
        longitude: formData.longitude,
      });

      login(res.data.token, res.data.user);
      navigate('/customer/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-6 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="flex justify-end">
          <LanguageSelector />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900">{t('customerRegistration')}</h2>
          <p className="text-xs text-slate-500">{t('createAccountQuickMend')}</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('fullName')}</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Rahul Sharma"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('email')}</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="rahul@example.com"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('phone')}</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('password')}</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
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
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('location')}</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder={t('locationPlaceholder')}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
            />
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
                      const autoAddress =
                        data?.address?.district ||
                        data?.address?.city ||
                        data?.address?.town ||
                        data?.address?.village ||
                        data?.display_name ||
                        'Current location';

                      setFormData((prev) => ({
                        ...prev,
                        address: autoAddress,
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {loading ? t('creatingAccount') : t('registerAsCustomer')}
          </button>

          <p className="text-xs text-center text-slate-500 pt-2">
            {t('alreadyHaveAccount')}{' '}
            <Link to="/login" className="font-bold text-sky-600 hover:underline">
              {t('loginHere')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
