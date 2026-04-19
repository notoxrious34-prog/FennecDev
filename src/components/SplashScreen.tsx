import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../i18n/useTranslation';

// استيراد الشعار كمتغير لضمان حزمه داخل الـ EXE
// ملاحظة: تأكد أن ملف logo-fennec.png موجود في مجلد src/assets
// @ts-ignore
import logoFennec from '../assets/logo-fennec.png';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        {/* حاوية الشعار */}
        <div className="relative w-80 h-80 mb-16 rounded-full overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black">
          <img 
            src={logoFennec} 
            alt="Fennec Logo" 
            className="w-full h-full object-cover scale-[1.12]" 
            // إلغاء سياسة التتبع لضمان التحميل المحلي السريع
            referrerPolicy="no-referrer"
          />
        </div>
        
        {/* مؤشر التحميل (Spinner) بنمط ويندوز 11 */}
        <div className="relative w-12 h-12 mb-8">
          <svg className="animate-spin" viewBox="0 0 50 50">
            <circle
              className="opacity-25"
              cx="25"
              cy="25"
              r="20"
              stroke="white"
              strokeWidth="4"
              fill="none"
            />
            <circle
              className="opacity-75"
              cx="25"
              cy="25"
              r="20"
              stroke="white"
              strokeWidth="4"
              fill="none"
              strokeDasharray="80"
              strokeDashoffset="60"
            />
          </svg>
        </div>

        {/* نص الترحيب المتحرك */}
        <motion.h2 
          className="text-xl font-light tracking-wider text-white/80 text-center px-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          {t('splashWelcome')}
        </motion.h2>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;