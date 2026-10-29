import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/admin-login', { name, password });
      login(response.data.token, response.data.user);
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError(err.response?.data?.error || 'Unable to verify platform owner credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-indigo-100 bg-white p-8 shadow-xl sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Restricted access</p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Platform Owner Login</h1>
          <p className="mt-2 text-sm text-slate-500">Monitor customers, service providers, bookings, and revenue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">{error}</div>}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700" htmlFor="admin-name">Owner name</label>
            <input
              id="admin-name"
              type="text"
              required
              autoComplete="username"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter platform owner name"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700" htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter owner password"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:from-indigo-700 hover:to-sky-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Verifying access...' : 'Enter Admin Control Panel'}
          </button>
        </form>

        <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" />
          Back to customer/provider login
        </Link>
      </div>
    </div>
  );
};
