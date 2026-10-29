import React from 'react';
import { Wrench, Bot, Navigation, ShieldCheck, Star, CreditCard } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    { num: '1', title: 'Describe your problem', desc: 'Describe your issue via text, speech voice input, or upload an image.' },
    { num: '2', title: 'AI understands problem', desc: 'AI diagnoses severity, safety hazards, and technical problem details.' },
    { num: '3', title: 'Correct service identified', desc: 'System maps issue to the exact home service category.' },
    { num: '4', title: 'Find nearby available provider', desc: 'Matches ON-DUTY available providers using distance, rating, experience, and service radius.' },
    { num: '5', title: 'Booking request automatically initiated', desc: 'Request dispatched to best eligible provider without manual form re-entry.' },
    { num: '6', title: 'Provider accepts', desc: 'Provider reviews job estimate & accepts.' },
    { num: '7', title: 'Track provider', desc: 'Follow real-time GPS movement & live ETA on the map.' },
    { num: '8', title: 'Service completed', desc: 'Technician arrives and performs home repair.' },
    { num: '9', title: 'Pay with PayPal', desc: 'Complete payment securely through PayPal Sandbox.' },
    { num: '10', title: 'Give feedback', desc: 'Submit rating and comments for the completed booking.' },
    { num: '11', title: 'Provider rating automatically updated', desc: 'Backend recalculates provider average rating and updates profile stats.' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold text-slate-900">How QuickMend Works</h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Complete step-by-step workflow from problem diagnosis to automated provider rating update.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((s) => (
          <div key={s.num} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-extrabold flex items-center justify-center shrink-0">
              {s.num}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
