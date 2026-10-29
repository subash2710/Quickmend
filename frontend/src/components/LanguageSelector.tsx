import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../types';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${className}`}>
      <Globe className="w-4 h-4 text-sky-600" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="bg-transparent border-none outline-none cursor-pointer font-medium text-slate-800"
      >
        <option value="en">English (EN)</option>
        <option value="ta">தமிழ் (TA)</option>
        <option value="hi">हिंदी (HI)</option>
      </select>
    </div>
  );
};
