import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { User, Wrench, Shield, ArrowRight, CheckCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'PROVIDER' | null>(
    (searchParams.get('role') as any) || null
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChoice = (role: 'CUSTOMER' | 'PROVIDER') => {
    setSelectedRole(role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;

      login(token, user);

      // Redirect to appropriate dashboard based on backend user.role
      if (user.role === 'PROVIDER') {
        navigate('/provider/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Invalid login credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900">{t('welcome')}</h2>
          <p className="text-sm font-semibold text-sky-600">{t('chooseRole')}</p>
        </div>

        {/* TWO SEPARATE ROLE SELECTION CARDS (SECTION 6) */}
        {!selectedRole ? (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            {/* Customer Card */}
            <div
              onClick={() => handleRoleChoice('CUSTOMER')}
              className="p-6 rounded-2xl border-2 border-slate-200 hover:border-sky-500 bg-white hover:bg-sky-50/50 cursor-pointer transition-all duration-200 space-y-4 text-center group flex flex-col justify-between"
            >
              <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <User className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">{t('customerTitle')}</h3>
                <p className="text-xs text-slate-500">{t('customerDesc')}</p>
              </div>
              <button className="w-full py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-sm group-hover:bg-sky-700 transition-colors">
                {t('customerBtn')}
              </button>
            </div>

            {/* Provider Card */}
            <div
              onClick={() => handleRoleChoice('PROVIDER')}
              className="p-6 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/50 cursor-pointer transition-all duration-200 space-y-4 text-center group flex flex-col justify-between"
            >
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Wrench className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">{t('providerTitle')}</h3>
                <p className="text-xs text-slate-500">{t('providerDesc')}</p>
              </div>
              <button className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm group-hover:bg-indigo-700 transition-colors">
                {t('providerBtn')}
              </button>
            </div>
          </div>
          <div className="pt-5 text-center">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <Shield className="w-4 h-4" />
              Platform owner access
            </Link>
          </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Logging in as <span className="text-sky-600">{selectedRole}</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                className="text-xs font-semibold text-sky-600 hover:underline"
              >
                Change Role
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-sm rounded-xl shadow-md hover:from-sky-700 hover:to-indigo-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Sign In to QuickMend'}
            </button>

            {/* Quick Demo Login Helpers */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <p className="text-xs font-semibold text-slate-400 text-center">Quick Demo Credentials:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('rahul@quickmend.com');
                    setPassword('customer123');
                    setSelectedRole('CUSTOMER');
                  }}
                  className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 font-medium text-left"
                >
                  👤 Customer Demo (Rahul)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('arun@quickmend.com');
                    setPassword('provider123');
                    setSelectedRole('PROVIDER');
                  }}
                  className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 font-medium text-left"
                >
                  🔧 Provider Demo (Arun)
                </button>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Don't have an account?{' '}
                <Link
                  to={selectedRole === 'PROVIDER' ? '/register-provider' : '/register'}
                  className="font-bold text-sky-600 hover:underline"
                >
                  Register Here
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
