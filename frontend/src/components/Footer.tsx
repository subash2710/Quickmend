import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Shield, Zap, Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <footer className={`border-t transition-colors ${isDark ? 'bg-slate-950 text-slate-300 border-slate-800' : 'bg-white text-slate-700 border-slate-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-white">QuickMend</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              AI-powered local home service finder connecting customers with verified nearby professionals on demand.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/services" className="hover:text-white transition-colors">Services</Link></li>
              <li><Link to="/ai-assistant" className="hover:text-white transition-colors">AI Assistant</Link></li>
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Customer Login</Link></li>
              <li><Link to="/register-provider" className="hover:text-white transition-colors">Become a Provider</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Top Services</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Electrical Repairs</li>
              <li>Plumbing & Leak Fixes</li>
              <li>AC Service & Gas Refill</li>
              <li>Deep House Cleaning</li>
              <li>Locksmith Emergency</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Platform Security</h4>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Verified Providers & Ratings</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Instant Automatic Dispatch</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <p className="font-semibold text-white mb-1">PayPal Sandbox Ready</p>
                <p>Secure end-to-end sandbox payments verified on backend.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 QuickMend Inc. All rights reserved. On-Demand Home Service Platform.</p>
          <div className="flex items-center gap-1 mt-2 sm:mt-0">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>using React, Flask & Socket.IO</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
