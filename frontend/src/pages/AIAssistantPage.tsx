import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AIAnalysis } from '../types';
import { VoiceInput } from '../components/VoiceInput';
import { useLanguage } from '../context/LanguageContext';
import {
  Bot,
  Sparkles,
  Wrench,
  Loader2,
  Send
} from 'lucide-react';

export const AIAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/ai/analyze', { text: input, language });
      setAnalysis(res.data);
    } catch (err) {
      console.error('AI chat error:', err);
      setError(t('aiDiagnosticServiceError', 'AI diagnostic service error. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const localizedDetectedService = analysis
    ? getLocalizedServiceName(analysis.detected_service)
    : '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-8 rounded-3xl shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold">
          <Bot className="w-4 h-4 text-teal-400" />
          <span>{t('aiDiagnosticEngine', 'QuickMend AI Diagnostic & Safety Engine')}</span>
        </div>
        <h1 className="text-3xl font-extrabold">{t('describeYourProblem', 'Describe Your Problem')}</h1>
        <p className="text-xs text-slate-300 max-w-xl">
          {t('describeProblemHint', 'Enter your problem description, speak, or upload an image. QuickMend AI identifies the technical issue, provides non-hazardous troubleshooting steps, and finds nearby professionals.')}
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl">
            {error}
          </div>
        )}

        <div className="relative">
          <textarea
            rows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('describeProblemPlaceholder', 'e.g. My sink drain is completely blocked and water is overflowing')}
            className="w-full p-4 border-2 border-slate-200 rounded-2xl focus:border-teal-500 outline-none resize-none text-sm"
          ></textarea>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <VoiceInput onTranscript={(t) => setInput((prev) => (prev ? `${prev} ${t}` : t))} />

          <button
            onClick={handleAnalyze}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{t('analyzeProblemWithAi', 'Analyze Problem with AI')}</span>
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <h3 className="font-extrabold text-slate-900 text-lg">{t('aiDiagnosticResult', 'AI Diagnostic Summary')}</h3>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">
              {t('aiActive', 'AI Active')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-bold block text-[10px] uppercase">{t('recommendedService', 'Recommended Service')}</span>
              <span className="font-extrabold text-slate-900 text-base">{localizedDetectedService}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-bold block text-[10px] uppercase">{t('severity', 'Severity')}</span>
              <span className="font-extrabold text-amber-600 text-base">{analysis.severity}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-bold block text-[10px] uppercase">{t('professionalAssistance', 'Professional Assistance')}</span>
              <span className="font-extrabold text-emerald-600 text-base">{t('required', 'Required')}</span>
            </div>
          </div>

          {analysis.ai_response && (
            <div className="p-4 bg-sky-50 border border-sky-200 text-sky-900 text-sm rounded-2xl">
              {analysis.ai_response}
            </div>
          )}

          {analysis.safety_tip && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
              {analysis.safety_tip}
            </div>
          )}

          {analysis.troubleshooting_steps && (
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-800">{t('safeTroubleshootingGuidance', 'Safe Troubleshooting Guidance:')}</span>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                {analysis.troubleshooting_steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => navigate(`/customer/dashboard?service=${encodeURIComponent(analysis.detected_service)}`)}
            className="w-full py-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Wrench className="w-5 h-5" />
            <span>{t('bookNearbyProfessional', 'Book Nearby {service} Professional Now').replace('{service}', localizedDetectedService)}</span>
          </button>
        </div>
      )}
    </div>
  );
};
