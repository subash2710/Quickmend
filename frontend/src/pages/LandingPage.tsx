import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { Service } from '../types';
import { ServiceCard } from '../components/ServiceCard';
import {
  Wrench,
  Zap,
  Hammer,
  Sparkles,
  Fan,
  Tv,
  Paintbrush,
  KeyRound,
  HelpCircle,
  Bot,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Search,
  Navigation,
  Star,
  CreditCard
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/services');
        setServices(res.data.services || []);
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const workflowSteps = [
    { num: '1', title: 'Describe your problem', desc: 'Type, speak, or upload an image of your home issue' },
    { num: '2', title: 'AI understands problem', desc: 'AI analyzes severity and technical context' },
    { num: '3', title: 'Correct service identified', desc: 'Exact service category automatically resolved' },
    { num: '4', title: 'Find nearby available provider', desc: 'Scans ON-DUTY available providers within radius' },
    { num: '5', title: 'Booking request initiated', desc: 'Automated dispatch sent to highest scored provider' },
    { num: '6', title: 'Provider accepts', desc: 'Provider reviews job details & accepts' },
    { num: '7', title: 'Track provider live', desc: 'Watch real-time GPS movement & ETA on map' },
    { num: '8', title: 'Service completed', desc: 'Technician arrives and completes repair' },
    { num: '9', title: 'Pay with PayPal', desc: 'Secure checkout via PayPal Sandbox' },
    { num: '10', title: 'Give feedback', desc: 'Submit 5-star rating & review' },
    { num: '11', title: 'Rating recalculated', desc: 'Provider rating automatically updated in DB' },
  ];

  return (
    <div className={`space-y-0 pb-0 transition-colors ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* HERO SECTION */}
      <section className={`relative overflow-hidden pt-16 pb-24 px-4 sm:px-6 lg:px-8 transition-colors ${isDark ? 'bg-gradient-to-b from-sky-900 via-slate-900 to-slate-950 text-white' : 'bg-gradient-to-b from-sky-50 via-white to-slate-100 text-slate-900'}`}>
        <div className={`absolute inset-0 ${isDark ? 'opacity-10' : 'opacity-30'} bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]`}></div>
        
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold backdrop-blur ${isDark ? 'bg-sky-500/10 border-sky-400/20 text-sky-300' : 'bg-sky-100/80 border-sky-200 text-sky-700 shadow-sm'}`}>
            <Bot className={`w-4 h-4 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
            <span>AI-Powered On-Demand Home Service Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            <span className={`block ${isDark ? 'text-white' : 'text-slate-900'}`}>QuickMend</span>
            <span className={`bg-gradient-to-r ${isDark ? 'from-sky-400 via-teal-300 to-indigo-300' : 'from-sky-600 via-cyan-500 to-indigo-600'} bg-clip-text text-transparent`}>
              {t('tagline')}
            </span>
          </h1>

          <p className={`max-w-2xl mx-auto text-base sm:text-lg leading-relaxed font-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Instant automatic matching with nearby ON-DUTY electricians, plumbers, carpenters, cleaners, and AC technicians. Live GPS tracking, PayPal Sandbox payment, and automated feedback ratings.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/login"
              className="px-8 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-sky-500/25 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <span>{t('getStarted')}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to="/register-provider"
              className={`px-8 py-4 border font-bold text-base rounded-2xl backdrop-blur transition-all flex items-center gap-2 ${isDark ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white' : 'bg-white/80 hover:bg-white border-sky-200 text-slate-800 shadow-sm'}`}
            >
              <Wrench className={`w-5 h-5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
              <span>{t('becomeProvider')}</span>
            </Link>

            <Link
              to="/ai-assistant"
              className={`px-8 py-4 border font-bold text-base rounded-2xl backdrop-blur transition-all flex items-center gap-2 ${isDark ? 'bg-teal-500/20 hover:bg-teal-500/30 border-teal-400/30 text-teal-300' : 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-700'}`}
            >
              <Bot className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
              <span>{t('askAi')}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CORE HOME SERVICES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="text-center space-y-2">
          <h2 className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Explore Home Services</h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Select any service to find verified ON-DUTY technicians near you</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-44 bg-slate-100 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                onSelect={() => navigate(`/login?service_id=${svc.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* HOW QUICKMEND WORKS (SECTION 5 WORKFLOW) */}
      <section className={`py-16 px-4 sm:px-6 lg:px-8 transition-colors ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>End-to-End Platform Flow</span>
            <h2 className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>How QuickMend Works</h2>
            <p className={`text-sm max-w-xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Inspired by modern on-demand dispatch platforms — intelligent AI diagnostic matching to completed service rating.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflowSteps.map((step) => (
              <div
                key={step.num}
                className={`p-5 rounded-2xl relative space-y-2 border transition-colors ${isDark ? 'bg-slate-800/80 border-slate-700/80 hover:border-sky-500' : 'bg-slate-50 border-slate-200 hover:border-sky-300 shadow-sm'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold mb-1 border ${isDark ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' : 'bg-sky-100 text-sky-700 border-sky-200'}`}>
                  {step.num}
                </div>
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{step.title}</h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
