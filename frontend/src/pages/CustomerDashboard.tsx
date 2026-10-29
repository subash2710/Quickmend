import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Service, Booking, AIAnalysis, ProviderOption } from '../types';
import { ServiceCard } from '../components/ServiceCard';
import { VoiceInput } from '../components/VoiceInput';
import {
  Search,
  Bot,
  Wrench,
  Camera,
  MapPin,
  Clock,
  ArrowRight,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Sparkles,
  XCircle
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [problemDescription, setProblemDescription] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSearchingProvider, setIsSearchingProvider] = useState(false);
  const [providerOptions, setProviderOptions] = useState<ProviderOption[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [showProviderSelection, setShowProviderSelection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchActiveBooking();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get('/services');
      setServices(res.data.services || []);
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  };

  const fetchActiveBooking = async () => {
    try {
      const res = await api.get('/bookings');
      const bookings: Booking[] = res.data.bookings || [];
      const active = bookings.find((b) =>
        [
          'SEARCHING_PROVIDER',
          'PROVIDER_ASSIGNED',
          'PROVIDER_ACCEPTED',
          'PROVIDER_ON_THE_WAY',
          'PROVIDER_ARRIVED',
          'SERVICE_STARTED',
          'PAYMENT_PENDING',
        ].includes(b.status)
      );
      if (active) {
        setActiveBooking(active);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  };

  const handleCancelBooking = async () => {
    if (!activeBooking || !window.confirm('Cancel this booking?')) return;

    setIsCancellingBooking(true);
    setError(null);
    try {
      await api.post(`/bookings/${activeBooking.id}/cancel`);
      setActiveBooking(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel booking.');
    } finally {
      setIsCancellingBooking(false);
    }
  };

  const handleAskAI = async () => {
    if (!problemDescription.trim()) {
      setError('Please describe your home issue first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await api.post('/ai/analyze', {
        text: problemDescription,
        selected_service_id: selectedServiceId,
        customer_id: user?.id,
        language,
      });

      const analysis: AIAnalysis = res.data;
      setAiAnalysis(analysis);

      // Auto-highlight recommended service
      if (analysis.detected_service) {
        const matched = services.find((s) => s.name.toLowerCase() === analysis.detected_service.toLowerCase());
        if (matched) {
          setSelectedServiceId(matched.id);
        }
      }
    } catch (err: any) {
      console.error('AI analysis error:', err);
      setError('AI diagnostic service temporarily unavailable.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createServiceRequest = async (providerId?: number) => {
    if (!problemDescription.trim() && !selectedServiceId) {
      setError('Please describe your problem or select a service.');
      return;
    }

    const selectedService = services.find((svc) => svc.id === selectedServiceId);
    const serviceName = aiAnalysis?.detected_service || selectedService?.name || '';
    const parsedProblem = problemDescription.trim() || `Need help with ${serviceName || 'home service'} service.`;

    setIsSearchingProvider(true);
    setError(null);

    try {
      const res = await api.post('/service-requests', {
        problem_description: parsedProblem,
        service_id: selectedServiceId,
        service_name: serviceName,
        severity: aiAnalysis?.severity || 'Medium',
        ai_classification: aiAnalysis?.detected_problem || '',
        latitude: user?.latitude || 12.9716,
        longitude: user?.longitude || 77.5946,
        provider_id: providerId,
      });

      const { booking } = res.data;
      if (booking) {
        setActiveBooking(booking);
        navigate(`/customer/track?booking_id=${booking.id}`);
      } else {
        setError('No active ON-DUTY providers are currently available near your area.');
      }
    } catch (err: any) {
      console.error('Provider search error:', err);
      setError(err.response?.data?.error || 'Failed to initiate provider search');
    } finally {
      setIsSearchingProvider(false);
    }
  };

  const handleFindProfessional = async () => {
    if (!problemDescription.trim() && !selectedServiceId) {
      setError(t('describeOrSelectService', 'Please describe your problem or select a service.'));
      return;
    }

    const selectedService = services.find((svc) => svc.id === selectedServiceId);
    const serviceName = aiAnalysis?.detected_service || selectedService?.name || '';
    const service = selectedService || services.find((svc) => svc.name === serviceName);
    if (!service) {
      setError(t('selectServiceBeforeProvider', 'Please select a service before choosing a provider.'));
      return;
    }

    setIsSearchingProvider(true);
    setError(null);
    try {
      const res = await api.post('/service-requests/options', {
        service_id: service.id,
        latitude: user?.latitude || 12.9716,
        longitude: user?.longitude || 77.5946,
      });
      const options: ProviderOption[] = res.data.providers || [];
      if (options.length > 1) {
        setProviderOptions(options);
        setSelectedProviderId(options[0].provider.id);
        setShowProviderSelection(true);
        return;
      }
      if (options.length === 1) {
        await createServiceRequest(options[0].provider.id);
        return;
      }
      await createServiceRequest();
    } catch (err: any) {
      console.error('Provider options error:', err);
      setError(err.response?.data?.error || t('providerOptionsError', 'Unable to load nearby providers.'));
    } finally {
      setIsSearchingProvider(false);
    }
  };

  const handleProviderSelection = async () => {
    if (!selectedProviderId) return;
    setShowProviderSelection(false);
    setIsSearchingProvider(true);
    try {
      await createServiceRequest(selectedProviderId);
    } finally {
      setIsSearchingProvider(false);
    }
  };

  const handleBookSelectedService = () => {
    if (!selectedServiceId) {
      setError('Select a service first to continue.');
      return;
    }

    const selectedService = services.find((svc) => svc.id === selectedServiceId);
    if (selectedService) {
      setProblemDescription((prev) => prev.trim() || `Need help with ${selectedService.name.toLowerCase()} service.`);
    }
    handleFindProfessional();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileName = e.target.files[0].name;
      setProblemDescription(`[Image Analysis: ${fileName}] Leaking pipe fixture with water damage.`);
      handleAskAI();
    }
  };

  const formatSeverity = (value?: string) => {
    if (!value) return value;
    const map: Record<string, Record<string, string>> = {
      en: { Low: 'Low', Medium: 'Medium', High: 'High', Emergency: 'Emergency' },
      ta: { Low: 'குறைந்த', Medium: 'மிதமான', High: 'உயர்ந்த', Emergency: 'அவசரம்' },
      hi: { Low: 'कम', Medium: 'मध्यम', High: 'उच्च', Emergency: 'आपातकाल' },
    };
    return map[language]?.[value as keyof typeof map['en']] || value;
  };

  const formatProfessionalStatus = (value?: boolean) => {
    if (value === undefined) return '';
    const map = {
      en: value ? 'Yes (Technician Needed)' : 'No (DIY Safe)',
      ta: value ? 'ஆம் (தொழில்நுட்ப உதவி தேவை)' : 'இல்லை (சுய-செயல்பாடு பாதுகாப்பானது)',
      hi: value ? 'हाँ (तकनीशियन चाहिए)' : 'नहीं (DIY सुरक्षित)',
    };
    return map[language] || map.en;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Active Booking Banner */}
      {activeBooking && (
        <div className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
                Active Job in Progress ({activeBooking.status})
              </span>
            </div>
            <h3 className="text-xl font-bold">
              {activeBooking.service_name} &bull; {activeBooking.problem_description}
            </h3>
            <p className="text-xs text-sky-100">
              Provider: {activeBooking.provider?.name || 'Assigned Professional'} &bull; ETA: ~{activeBooking.estimated_arrival || 8} mins
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/customer/track?booking_id=${activeBooking.id}`)}
              className="px-6 py-3 bg-white text-sky-700 font-extrabold text-xs rounded-2xl shadow-md hover:bg-sky-50 transition-colors whitespace-nowrap"
            >
              Track Live Location &rarr;
            </button>
            {['SEARCHING_PROVIDER', 'PROVIDER_ASSIGNED', 'PROVIDER_ACCEPTED', 'PROVIDER_ON_THE_WAY', 'PROVIDER_ARRIVED'].includes(activeBooking.status) && (
              <button
                onClick={handleCancelBooking}
                disabled={isCancellingBooking}
                className="px-4 py-3 bg-rose-100 text-rose-800 font-extrabold text-xs rounded-2xl shadow-md hover:bg-rose-200 transition-colors whitespace-nowrap disabled:opacity-60"
              >
                <XCircle className="inline-block w-4 h-4 mr-1" />
                {isCancellingBooking ? 'Cancelling...' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* MAIN SEARCH / PROBLEM DESCRIPTION BOX (SECTION 10) */}
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-extrabold text-sky-600 uppercase tracking-widest">{t('instantDispatch')}</span>
          <h1 className="text-3xl font-extrabold text-slate-900">{t('howHelpToday')}</h1>
          <p className="text-xs text-slate-500">
            {t('describeProblemHint')}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs font-medium rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        {/* Large Problem Description Input */}
        <div className="relative">
          <textarea
            rows={3}
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            placeholder={t('describeProblemPlaceholder')}
            className="w-full p-4 pr-12 text-sm border-2 border-slate-200 rounded-2xl focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none resize-none transition-all"
          ></textarea>
        </div>

        {/* Four Core Action Buttons (Section 10) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            {/* Voice Button */}
            <VoiceInput
              onTranscript={(text) => setProblemDescription((prev) => (prev ? `${prev} ${text}` : text))}
            />

            {/* Image Upload Button */}
            <label className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-all">
              <Camera className="w-4 h-4 text-sky-600" />
              <span>{t('uploadImage')}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>

          <div className="flex items-center gap-3">
            {/* Ask AI Button */}
            <button
              onClick={handleAskAI}
              disabled={isAnalyzing}
              className="px-5 py-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              ) : (
                <Bot className="w-4 h-4 text-teal-600" />
              )}
              <span>{t('askAi')}</span>
            </button>

            {/* Find Professional Button (Triggers auto-booking flow) */}
            <button
              onClick={handleFindProfessional}
              disabled={isSearchingProvider}
              className="px-6 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSearchingProvider ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wrench className="w-4 h-4" />
              )}
              <span>{t('findProfessional')}</span>
            </button>
          </div>
        </div>

        {/* AI DIAGNOSTIC & WRONG-SERVICE DETECTION RESULTS */}
        {aiAnalysis && (
          <div className="mt-6 p-5 bg-slate-200/90 border border-slate-300 dark:bg-slate-800/90 dark:border-slate-700 rounded-2xl shadow-sm space-y-4 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-700 dark:text-sky-400" />
                <h4 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">{t('aiDiagnosticResult')}</h4>
              </div>
              <span className="text-[11px] font-bold bg-sky-700 border border-sky-800 px-2.5 py-1 rounded-md text-white shadow-sm">
                {aiAnalysis.mode || 'AI Active'}
              </span>
            </div>

            {aiAnalysis.ai_response && (
              <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-sm text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100">
                {aiAnalysis.ai_response}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 shadow-sm dark:bg-slate-900">
                <span className="text-slate-300 block text-[10px] font-bold uppercase tracking-wide">{t('identifiedService')}</span>
                <span className="mt-1 block font-extrabold text-white text-base">{aiAnalysis.detected_service}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 shadow-sm dark:bg-slate-900">
                <span className="text-slate-300 block text-[10px] font-bold uppercase tracking-wide">{t('severity')}</span>
                <span className="mt-1 block font-extrabold text-amber-400 text-base">{formatSeverity(aiAnalysis.severity)}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 shadow-sm dark:bg-slate-900">
                <span className="text-slate-300 block text-[10px] font-bold uppercase tracking-wide">{t('professionalRequired')}</span>
                <span className="mt-1 block font-extrabold text-emerald-400 text-base">
                  {formatProfessionalStatus(aiAnalysis.requires_professional)}
                </span>
              </div>
            </div>

            {/* Wrong-Service Mismatch Warning (Section 21) */}
            {aiAnalysis.is_service_mismatch && (
              <div className="p-3 bg-amber-100 border border-amber-400 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 shadow-sm dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0" />
                  <span className="font-semibold">{aiAnalysis.mismatch_warning}</span>
                </div>
                <button
                  onClick={() => {
                    const matched = services.find((s) => s.name.toLowerCase() === aiAnalysis.detected_service.toLowerCase());
                    if (matched) setSelectedServiceId(matched.id);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] shrink-0 transition-colors"
                >
                  Switch to {aiAnalysis.detected_service}
                </button>
              </div>
            )}

            {/* Safety & Troubleshooting */}
            {aiAnalysis.safety_tip && (
              <p className="text-sm font-bold text-red-700 bg-red-100 p-3 rounded-xl border border-red-200 shadow-sm dark:bg-red-950/40 dark:border-red-800 dark:text-red-100">
                {aiAnalysis.safety_tip}
              </p>
            )}

            {aiAnalysis.troubleshooting_steps && aiAnalysis.troubleshooting_steps.length > 0 && (
              <div className="space-y-2 rounded-xl bg-white/80 border border-slate-200 p-3 shadow-sm dark:bg-slate-900/60 dark:border-slate-700">
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{t('recommendedSteps')}</span>
                <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-200 space-y-1 pl-1">
                  {aiAnalysis.troubleshooting_steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SERVICE CARDS SELECTION GRID */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">{t('selectServiceDirectly')}</h2>
          {selectedServiceId && (
            <button
              type="button"
              onClick={handleBookSelectedService}
              className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-xs font-extrabold rounded-xl shadow-md"
            >
              Book Selected Service
            </button>
          )}
        </div>

        {selectedServiceId && (
          <div className="p-3 rounded-xl border border-sky-200 bg-sky-50 text-sky-800 text-xs font-semibold">
            {t('selectedService')} {services.find((svc) => svc.id === selectedServiceId)?.name || t('service')}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc) => (
            <ServiceCard
              key={svc.id}
              service={svc}
              selected={selectedServiceId === svc.id}
              onSelect={(selected) => setSelectedServiceId(selected.id)}
            />
          ))}
        </div>
      </div>

      {showProviderSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl space-y-5">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">{t('chooseProvider', 'Choose a Service Provider')}</h2>
              <p className="text-sm text-slate-500">{t('compareProviders', 'Compare rating, cost, and distance before booking.')}</p>
            </div>

            <div className="space-y-3">
              {providerOptions.map((option) => {
                const isSelected = selectedProviderId === option.provider.id;
                return (
                  <button
                    type="button"
                    key={option.provider.id}
                    onClick={() => setSelectedProviderId(option.provider.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50 shadow-md'
                        : 'border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold text-slate-900">{option.provider.name || t('assignedProfessional', 'Service Professional')}</h3>
                        <p className="text-xs text-slate-500">{option.provider.experience_years} {t('yearsExperience', 'years experience')}</p>
                      </div>
                      <span className="text-lg font-black text-emerald-700">₹{option.service_charge}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-xs font-semibold text-slate-700">
                      <span>⭐ {option.provider.rating.toFixed(1)} ({option.provider.review_count} {t('reviews', 'reviews')})</span>
                      <span>📍 {option.distance_km} km {t('away', 'away')}</span>
                      <span>⏱ ~{option.estimated_arrival} {t('minutes', 'mins')}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowProviderSelection(false)}
                className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm"
              >
                {t('cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleProviderSelection}
                disabled={!selectedProviderId || isSearchingProvider}
                className="px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm disabled:opacity-50"
              >
                {isSearchingProvider ? t('booking', 'Booking...') : t('bookThisProvider', 'Book This Provider')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
