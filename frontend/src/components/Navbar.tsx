import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageSelector } from './LanguageSelector';
import {
  Wrench,
  User as UserIcon,
  LogOut,
  Bell,
  Home,
  Bot,
  Calendar,
  MapPin,
  CreditCard,
  Briefcase,
  DollarSign,
  Star,
  ShieldAlert,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon?: any;
}

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const { notifications, isConnected } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  // Build nav links based on user role
  const getNavLinks = (): NavItem[] => {
    if (!user) {
      return [];
    }

    if (user.role === 'PROVIDER') {
      return [
        { label: t('dashboard'), path: '/provider/dashboard', icon: Home },
        { label: t('myServices'), path: '/provider/services', icon: Briefcase },
        { label: t('activeJob'), path: '/provider/active-job', icon: MapPin },
        { label: t('earnings'), path: '/provider/earnings', icon: DollarSign },
        { label: t('jobHistory'), path: '/provider/history', icon: Calendar },
        { label: t('reviews'), path: '/provider/reviews', icon: Star },
        { label: t('profile'), path: '/provider/profile', icon: UserIcon },
      ];
    }

    if (user.role === 'ADMIN') {
      return [
        { label: t('adminDashboard'), path: '/admin/dashboard', icon: ShieldAlert },
        { label: t('services'), path: '/services', icon: Briefcase },
        { label: t('bookings'), path: '/customer/bookings', icon: Calendar },
      ];
    }

    // Default CUSTOMER role
    return [
      { label: t('home'), path: '/customer/dashboard', icon: Home },
      { label: t('services'), path: '/services', icon: Briefcase },
      { label: t('aiAssistant'), path: '/ai-assistant', icon: Bot },
      { label: t('bookings'), path: '/customer/bookings', icon: Calendar },
      { label: t('track'), path: '/customer/track', icon: MapPin },
      { label: t('payments'), path: '/customer/payments', icon: CreditCard },
      { label: t('profile'), path: '/customer/profile', icon: UserIcon },
    ];
  };

  const navLinks = getNavLinks();

  const isDark = theme === 'dark';

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur border-b shadow-sm transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-700 text-slate-100' : 'bg-white/90 border-slate-200 text-slate-900 shadow-[0_1px_0_rgba(15,23,42,0.04)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-sky-600 to-indigo-700 bg-clip-text text-transparent">
              QuickMend
            </span>
            <span
              className={`hidden sm:inline-block ml-2 text-xs font-semibold border px-1.5 py-0.5 rounded ${
                isDark ? 'text-slate-300 border-slate-600' : 'text-slate-400 border-slate-200'
              }`}
            >
              {t('aiOnDemand', 'AI On-Demand')}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  active
                    ? isDark
                      ? 'bg-sky-500/15 text-sky-300 font-semibold'
                      : 'bg-sky-50 text-sky-700 font-semibold'
                    : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {Icon && (
                  <Icon className={`w-4 h-4 ${active ? 'text-sky-500' : isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                )}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className={`inline-flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-semibold transition-colors ${
              isDark
                ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden sm:inline">{isDark ? t('whiteMode') : t('darkMode')}</span>
          </button>

          <LanguageSelector />

          {isAuthenticated && (
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-amber-400'
              }`}
              title={isConnected ? 'Real-time WebSocket Active' : 'Connecting to Socket...'}
            ></span>
          )}

          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  className={`absolute right-0 mt-2 w-80 rounded-xl shadow-xl border py-2 z-50 ${
                    isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className={`px-4 py-2 border-b flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                    <span className={`font-semibold text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{t('notifications')}</span>
                    <span className="text-xs text-sky-600 font-medium">{notifications.length} {t('total')}</span>
                  </div>
                  <div className={`max-h-72 overflow-y-auto divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                    {notifications.length === 0 ? (
                      <p className={`p-4 text-xs text-center ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>No new notifications</p>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div key={n.id || Math.random()} className={`p-3 text-xs ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                          <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{n.title}</p>
                          <p className={`mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex flex-col text-right">
                <span className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{user.name}</span>
                <span className={`text-[11px] font-medium px-1.5 rounded self-end ${isDark ? 'text-sky-300 bg-sky-500/15' : 'text-sky-600 bg-sky-50'}`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-300 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'}`}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${isDark ? 'text-sky-300 bg-sky-500/10 hover:bg-sky-500/20' : 'text-sky-700 bg-sky-50 hover:bg-sky-100'}`}
              >
                {t('login')}
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 rounded-xl shadow-sm transition-all"
              >
                {t('getStarted')}
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg ${isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className={`md:hidden border-t px-4 py-3 space-y-2 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          {navLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                isActive(item.path)
                  ? isDark
                    ? 'bg-sky-500/15 text-sky-300'
                    : 'bg-sky-50 text-sky-700'
                  : isDark
                    ? 'text-slate-200 hover:bg-slate-800'
                    : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
