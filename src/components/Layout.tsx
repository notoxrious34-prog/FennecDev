import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { useAppContext } from '../store/AppContext';
import { PageTransition, ToastContainer } from './ui';
import { TrialBanner } from './layout/TrialBanner';

const Layout = () => {
  const { isRTL, lang } = useTranslation();
  const { settings } = useAppContext();

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    // Apply theme data attributes
    document.documentElement.setAttribute('data-theme', settings.theme || 'light');
    document.documentElement.setAttribute('data-accent', settings.accentColor || 'blue');
  }, [isRTL, lang, settings.theme, settings.accentColor]);

  return (
    <div className="flex h-screen bg-app overflow-hidden font-sans selection:bg-accent-500/30 transition-colors duration-300" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mica background effect */}
      {(settings.theme === 'mica-light' || settings.theme === 'mica-dark') && (
        <div className="fixed inset-0 -z-20 bg-gradient-to-br from-blue-100 via-purple-100 to-rose-100 dark:from-blue-900/40 dark:via-purple-900/40 dark:to-rose-900/40 opacity-80"></div>
      )}
      
      <Sidebar />
      <div className="flex-1 flex flex-col w-full relative">
        <TrialBanner />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-slate-200/30 to-transparent -z-10 pointer-events-none"></div>
          <div className="max-w-7xl mx-auto">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Layout;
