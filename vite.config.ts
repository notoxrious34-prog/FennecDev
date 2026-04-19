import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    // 1. السطر الأهم لإصلاح الشاشة البيضاء: يجعل المسارات تبدأ بـ ./ بدلاً من /
    base: './', 
    
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['fennec-icon.ico'],
        manifest: {
          name: 'Fennec Facturation',
          short_name: 'Fennec',
          description: 'برنامج فواتير احترافي للمحلات والورشات في الجزائر',
          theme_color: '#10b981',
          background_color: '#ffffff',
          display: 'standalone',
        },
      }),
    ],
    
    build: {
      // 2. تحديد مجلد المخرجات ليتوافق مع ما يطلبه Electron في ملف main.js
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      // لضمان التوافق مع محركات المتصفحات القديمة أحياناً في Electron
      target: 'esnext',
      // Enable code splitting for better bundle optimization
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['framer-motion', 'lucide-react'],
          },
        },
      },
    },

    resolve: {
      alias: {
        // يسمح لك باستخدام @ للوصول السريع لمجلد src
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});