import React from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { motion } from 'framer-motion';
import { 
  Info, 
  Mail, 
  Phone, 
  Globe, 
  HelpCircle, 
  BookOpen, 
  Github, 
  Twitter,
  Code,
  Heart
} from 'lucide-react';
import Logo from '../components/Logo';

const About = () => {
  const { t, isRTL } = useTranslation();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto space-y-8 pb-10"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('about')}</h1>
          <p className="text-slate-500 mt-1">{t('helpAndSupport')}</p>
        </div>
      </div>

      {/* App Info Card */}
      <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-24 h-24 mb-6 relative">
            <div className="absolute inset-0 bg-accent-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative z-10 transform scale-150">
              <Logo />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Fennec Facturation</h2>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent-50 text-accent-700 text-xs font-medium mb-6 border border-accent-100">
            v3.0.0
          </div>
          
          <p className="text-slate-600 max-w-2xl leading-relaxed">
            {t('appDescription')}
          </p>
        </div>
        <div className="bg-slate-50 p-4 text-center text-xs text-slate-400 border-t border-slate-100">
          {t('copyright')}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Developer Info */}
        <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Code size={20} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{t('developerInfo')}</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100/50 hover:border-slate-200 transition-colors">
              <div className="mt-1 text-slate-400">
                <Info size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{t('developerName')}</p>
                <p className="text-slate-900 font-medium">Fennec Team</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100/50 hover:border-slate-200 transition-colors">
              <div className="mt-1 text-slate-400">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{t('developerEmail')}</p>
                <a href="mailto:Fennec.34@outlook.com" className="text-accent-600 hover:text-accent-700 font-medium">Fennec.34@outlook.com</a>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100/50 hover:border-slate-200 transition-colors">
              <div className="mt-1 text-slate-400">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{t('developerPhone')}</p>
                <p className="text-slate-900 font-medium" dir="ltr">+213 770 80 70 05</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Instructions / Help */}
        <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <BookOpen size={20} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{t('instructions')}</h3>
          </div>
          
          <div className="space-y-4">
            <details className="group rounded-xl border border-slate-200/60 overflow-hidden">
              <summary className="flex items-center justify-between p-4 cursor-pointer bg-slate-50 group-hover:bg-slate-100/50 transition-colors">
                <span className="font-medium text-slate-700">{t('howToCreateInvoice')}</span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">
                  <HelpCircle size={16} />
                </span>
              </summary>
              <div className="p-4 text-sm text-slate-600 leading-relaxed bg-white border-t border-slate-100">
                {t('howToCreateInvoiceDesc')}
              </div>
            </details>

            <details className="group rounded-xl border border-slate-200/60 overflow-hidden">
              <summary className="flex items-center justify-between p-4 cursor-pointer bg-slate-50 group-hover:bg-slate-100/50 transition-colors">
                <span className="font-medium text-slate-700">{t('howToAddClient')}</span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">
                  <HelpCircle size={16} />
                </span>
              </summary>
              <div className="p-4 text-sm text-slate-600 leading-relaxed bg-white border-t border-slate-100">
                {t('howToAddClientDesc')}
              </div>
            </details>

            <details className="group rounded-xl border border-slate-200/60 overflow-hidden">
              <summary className="flex items-center justify-between p-4 cursor-pointer bg-slate-50 group-hover:bg-slate-100/50 transition-colors">
                <span className="font-medium text-slate-700">{t('howToBackup')}</span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">
                  <HelpCircle size={16} />
                </span>
              </summary>
              <div className="p-4 text-sm text-slate-600 leading-relaxed bg-white border-t border-slate-100">
                {t('howToBackupDesc')}
              </div>
            </details>
          </div>
        </motion.div>
      </div>
      
      <motion.div variants={item} className="flex justify-center pt-8">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <span>Made with</span>
          <Heart size={16} className="text-rose-500 fill-rose-500 animate-pulse" />
          <span>by Fennec Team</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default About;
