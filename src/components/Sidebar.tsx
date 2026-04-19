import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  Settings,
  Menu,
  X,
  Info,
  Download,
  Maximize,
  Minimize
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { motion } from 'framer-motion';
import Logo from './Logo';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t, isRTL } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: t('dashboard') },
    { path: '/invoices', icon: <FileText size={20} />, label: t('invoices') },
    { path: '/clients', icon: <Users size={20} />, label: t('clients') },
    { path: '/products', icon: <Package size={20} />, label: t('products') },
    { path: '/settings', icon: <Settings size={20} />, label: t('settings') },
    { path: '/about', icon: <Info size={20} />, label: t('about') },
  ];

  return (
    <>
      <button 
        className={`md:hidden fixed top-4 ${isRTL ? 'right-4' : 'left-0'} z-50 p-2 bg-[var(--color-bg-elevated)]/90 backdrop-blur-sm rounded-xl shadow-[var(--shadow-lg)] text-[var(--color-text-primary)] no-print border border-[var(--color-border)]`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} z-40 w-72 bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'} md:translate-x-0 md:static md:flex-shrink-0 no-print flex flex-col shadow-[var(--shadow-md)] border border-[var(--color-border)]`}>
        <div className="flex items-center justify-center h-28 shrink-0">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <Logo />
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Fennec</h1>
          </motion.div>
        </div>
        
        <nav className="mt-4 px-4 space-y-1.5 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center relative ${isRTL ? 'space-x-3 space-x-reverse' : 'space-x-3'} px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-accent-50 dark:bg-accent-500/10 text-accent-700 dark:text-accent-400 font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav"
                      className={`absolute ${isRTL ? 'right-0' : 'left-0'} w-1 h-6 bg-accent-500 rounded-full`}
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className={`${isActive ? 'text-accent-600 dark:text-accent-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'} transition-colors`}>
                    {item.icon}
                  </span>
                  <span className="tracking-wide text-sm">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-white/5 space-y-2">
          <button
            onClick={toggleFullscreen}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            <span>{isFullscreen ? t('exitFullscreen') : t('fullscreen')}</span>
          </button>

          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors text-sm font-bold"
            >
              <Download size={20} />
              <span>{t('installApp')}</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[var(--color-bg-base)]/60 backdrop-blur-sm z-30 md:hidden no-print"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
