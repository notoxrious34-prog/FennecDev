import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { motion } from 'framer-motion';
import { Key, Lock, CheckCircle, XCircle, Cpu } from 'lucide-react';

interface ActivationProps {
  onSuccess: () => void;
}

const LicenseActivation: React.FC<ActivationProps> = ({ onSuccess }) => {
  const { t, isRTL } = useTranslation();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [machineId, setMachineId] = useState('');

  useEffect(() => {
    // Fetch machine ID
    if (window.api.license) {
      window.api.license.getMachineId().then((res: any) => {
        if (res.success && res.machineId) {
          setMachineId(res.machineId);
        }
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!window.api.license) {
      setError('License API not available');
      return;
    }

    const result = await window.api.license.activate(key);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } else {
      setError(result.error?.message || 'Invalid license key');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent-50 rounded-full flex items-center justify-center mx-auto mb-4 text-accent-600">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">License Activation</h1>
          <p className="text-slate-500 text-sm">Enter your license key to activate Fennec Facturation</p>
        </div>

        {/* Machine ID Display */}
        {machineId && (
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Cpu size={16} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Your Machine ID:</span>
            </div>
            <code className="text-xs text-slate-600 break-all font-mono">{machineId}</code>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              License Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Key size={18} />
              </div>
              <textarea
                value={key}
                onChange={(e) => setKey(e.target.value.trim())}
                placeholder="Paste your license key here..."
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 font-mono text-sm resize-none ${
                  error ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200/80'
                }`}
                rows={4}
              />
            </div>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 mt-2 text-rose-600 text-sm"
              >
                <XCircle size={16} />
                <span>{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 mt-2 text-emerald-600 text-sm"
              >
                <CheckCircle size={16} />
                <span>License activated successfully!</span>
              </motion.div>
            )}
          </div>

          <button
            type="submit"
            disabled={success || !key}
            className={`w-full py-3 rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 ${
              success 
                ? 'bg-emerald-500 text-white cursor-default'
                : 'bg-accent-600 hover:bg-accent-700 text-white'
            }`}
          >
            {success ? (
              <>
                <CheckCircle size={20} />
                Activated
              </>
            ) : (
              'Activate License'
            )}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Contact support for license assistance
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LicenseActivation;
