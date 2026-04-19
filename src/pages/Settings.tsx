import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { Save, Download, Upload, Monitor, Palette, Sliders, Database, Shield, Key } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import BackupPanel from '../components/settings/BackupPanel';
import AuditPanel from '../components/settings/AuditPanel';
import { motion, AnimatePresence } from 'framer-motion';

const SETTINGS_TABS = [
  { id: 'general', labelKey: 'settings.tabs.general', icon: Sliders },
  { id: 'backup', labelKey: 'settings.tabs.backup', icon: Database },
  { id: 'audit', labelKey: 'settings.tabs.audit', icon: Shield },
  { id: 'license', labelKey: 'settings.tabs.license', icon: Key },
];

const GeneralSettings = ({ settings, updateSettings }: any) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleDownloadBackup = () => {
    const jsonString = JSON.stringify({
      clients: [],
      products: [],
      invoices: [],
      settings: formData,
    });
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm(t('warningRestore'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const jsonString = event.target?.result as string;
        try {
          const data = JSON.parse(jsonString);
          if (data.settings) {
            updateSettings(data.settings);
            alert(t('backupRestored'));
            window.location.reload();
          } else {
            alert(t('invalidBackupFile'));
          }
        } catch (err) {
          alert(t('invalidBackupFile'));
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const themes = [
    { id: 'light', name: 'Windows 11 Light', icon: '☀️' },
    { id: 'dark', name: 'Windows 11 Dark', icon: '🌙' },
    { id: 'mica-light', name: 'Mica Light (Glass)', icon: '🪟' },
    { id: 'mica-dark', name: 'Mica Dark (Glass)', icon: '🌌' },
  ];

  const accentColors = [
    { id: 'rose-gold', name: 'Rose Gold', color: '#C4956A' },
    { id: 'blue', name: 'Blue', color: '#0078d4' },
    { id: 'purple', name: 'Purple', color: '#8b5cf6' },
    { id: 'emerald', name: 'Emerald', color: '#10b981' },
  ];

  return (
    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-10">
      {/* Theme & Appearance Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Monitor className="text-slate-500" size={20} />
          <h3 className="text-lg font-semibold text-slate-800">{t('appearanceAndThemes')}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">{t('appTheme')}</label>
            <div className="grid grid-cols-2 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setFormData({...formData, theme: theme.id as any})}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-all ${
                    formData.theme === theme.id 
                      ? 'border-accent-500 bg-accent-50 text-accent-700 ring-1 ring-accent-500' 
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl">{theme.icon}</span>
                  <span className="text-left" dir="ltr">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">{t('accentColor')}</label>
            <div className="flex flex-wrap gap-3">
              {accentColors.map((accent) => (
                <button
                  key={accent.id}
                  type="button"
                  onClick={() => setFormData({...formData, accentColor: accent.id as any})}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    formData.accentColor === accent.id 
                      ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' 
                      : 'hover:scale-105 hover:shadow-sm'
                  }`}
                  style={{ backgroundColor: accent.color }}
                  title={accent.name}
                >
                  {formData.accentColor === accent.id && (
                    <div className="w-4 h-4 rounded-full bg-white/90 shadow-sm"></div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">{t('accentColorDesc')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
        <div className="space-y-5">
          <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3">{t('storeInfo')}</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('storeName')}</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm bg-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('phone')}</label>
            <input 
              type="text" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm font-mono bg-white"
              dir="ltr"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('email')}</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm bg-white"
              dir="ltr"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('address')}</label>
            <textarea 
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm resize-none bg-white"
            ></textarea>
          </div>
        </div>

        <div className="space-y-5">
          <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3">{t('billingSettings')}</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('language')}</label>
            <select 
              value={formData.language || 'ar'}
              onChange={(e) => setFormData({
                ...formData, 
                language: e.target.value as any,
                currency: 'DZD'
              })}
              className="w-full px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white text-sm"
            >
              <option value="ar">{t('arabic')}</option>
              <option value="fr">{t('french')}</option>
              <option value="en">{t('english')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('currency')}</label>
            <input 
              type="text" 
              required
              value={formData.currency}
              onChange={(e) => setFormData({...formData, currency: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm bg-white"
            />
            <p className="text-xs text-slate-500 mt-1.5">{t('example')} د.ج، دينار جزائري، DZD</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('taxRate')}</label>
            <input 
              type="number" 
              min="0"
              max="100"
              step="0.01"
              value={formData.taxRate}
              onChange={(e) => setFormData({...formData, taxRate: parseFloat(e.target.value) || 0})}
              className="w-full px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm font-mono bg-white"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      <div className="space-y-5 pt-8 border-t border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3">{t('taxLegalInfoInvoice')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('nif')}</label>
            <input 
              type="text" 
              value={formData.nif || ''}
              onChange={(e) => setFormData({...formData, nif: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm font-mono bg-white"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('nis')}</label>
            <input 
              type="text" 
              value={formData.nis || ''}
              onChange={(e) => setFormData({...formData, nis: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm font-mono bg-white"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('rc')}</label>
            <input 
              type="text" 
              value={formData.rc || ''}
              onChange={(e) => setFormData({...formData, rc: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm font-mono bg-white"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('ai')}</label>
            <input 
              type="text" 
              value={formData.ai || ''}
              onChange={(e) => setFormData({...formData, ai: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm font-mono bg-white"
              dir="ltr"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('bankAccount')}</label>
            <input 
              type="text" 
              value={formData.bankAccount || ''}
              onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm font-mono bg-white"
              dir="ltr"
              placeholder={t('bankAccountExample')}
            />
          </div>
        </div>
      </div>

      <div className="space-y-5 pt-8 border-t border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-3">{t('backupAndRestore')}</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200/80 font-medium text-sm"
          >
            <Download size={18} />
            {t('downloadBackup')}
          </button>
          
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreBackup}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200/80 font-medium text-sm w-full sm:w-auto"
            >
              <Upload size={18} />
              {t('restoreBackup')}
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-500 bg-amber-50/50 border border-amber-100/50 p-3 rounded-lg inline-block">
          {t('warningRestore')}
        </p>
      </div>

      <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
        {isSaved ? (
          <span className="text-emerald-600 font-medium text-sm bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-100">{t('settingsSaved')}</span>
        ) : (
          <span></span>
        )}
        <button 
          type="submit" 
          className="bg-accent-600 hover:bg-accent-700 text-accent-fg px-6 py-3 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2 text-sm"
        >
          <Save size={18} />
          {t('saveChanges')}
        </button>
      </div>
    </form>
  );
};

const LicenseTab = () => {
  const { t } = useTranslation();
  return (
    <div className="p-6 md:p-8 text-center">
      <Key className="text-slate-300 mx-auto mb-4" size={48} />
      <h3 className="text-lg font-semibold text-slate-900 mb-2">License Management</h3>
      <p className="text-sm text-slate-500">License activation is handled at application startup.</p>
    </div>
  );
};

const Settings = () => {
  const { settings, updateSettings } = useAppContext();
  const { t, isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');

  // Handle hash change on mount
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && SETTINGS_TABS.some(tab => tab.id === hash)) {
      setActiveTab(hash);
    }
  }, []);

  // Update hash when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings settings={settings} updateSettings={updateSettings} />;
      case 'backup':
        return <BackupPanel />;
      case 'audit':
        return <AuditPanel />;
      case 'license':
        return <LicenseTab />;
      default:
        return <GeneralSettings settings={settings} updateSettings={updateSettings} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('settings')}</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Vertical Tabs (Desktop) */}
        <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-slate-200/60 bg-slate-50/50">
          <nav className="p-2 space-y-1">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-accent-50 text-accent-700 border-l-3 border-accent-500'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  } ${isRTL ? 'border-r-3' : 'border-l-3'}`}
                  style={isActive ? { borderLeftWidth: '3px', borderLeftColor: 'var(--color-accent)' } : {}}
                >
                  <Icon size={18} />
                  <span>{t(tab.labelKey as any)}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;
