/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider, useAppContext } from './store/AppContext';
import { ToastProvider } from './components/ui/Toast/ToastContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Products from './pages/Products';
import Settings from './pages/Settings';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import ViewInvoice from './pages/ViewInvoice';
import About from './pages/About';
import LicenseActivation from './pages/LicenseActivation';
import SplashScreen from './components/SplashScreen';

function AppContent() {
  const { isLoading } = useAppContext();
  const [isLicensed, setIsLicensed] = useState(false);
  const [licenseChecked, setLicenseChecked] = useState(false);

  useEffect(() => {
    const checkLicense = async () => {
      if (window.api.license) {
        const result = await window.api.license.checkStatus();
        setIsLicensed(result.data?.valid || false);
        setLicenseChecked(true);
      } else {
        // If license API not available, allow access (dev mode)
        setIsLicensed(true);
        setLicenseChecked(true);
      }
    };
    checkLicense();
  }, []);

  if (isLoading) {
    return <SplashScreen onComplete={() => {}} />;
  }

  if (!licenseChecked) {
    return <SplashScreen onComplete={() => {}} />;
  }

  if (!isLicensed) {
    return <LicenseActivation onSuccess={() => setIsLicensed(true)} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="products" element={<Products />} />
        <Route path="settings" element={<Settings />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/new" element={<CreateInvoice />} />
        <Route path="invoices/:id" element={<ViewInvoice />} />
        <Route path="about" element={<About />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <Router>
          <AppContent />
        </Router>
      </AppProvider>
    </ToastProvider>
  );
}
