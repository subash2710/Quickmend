import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useTheme } from '../context/ThemeContext';

export const MainLayout: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Navbar />
      <main className={`flex-grow transition-colors ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
