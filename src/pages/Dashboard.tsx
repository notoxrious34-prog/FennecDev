import React from 'react';
import { useAppContext } from '../store/AppContext';
import { FileText, Users, Package, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { invoices, clients, products, settings } = useAppContext();
  const { t, formatCurrency, isRTL } = useTranslation();

  const totalRevenue = invoices
    .filter(i => i.status === 'paid' || i.status === 'partial')
    .reduce((sum, i) => sum + i.total, 0);

  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid').length;

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200/60">{t('paid')}</span>;
      case 'unpaid':
        return <span className="px-2.5 py-1 text-xs font-medium bg-rose-50 text-rose-700 rounded-md border border-rose-200/60">{t('unpaid')}</span>;
      case 'partial':
        return <span className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-md border border-amber-200/60">{t('partial')}</span>;
      default:
        return null;
    }
  };

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
      className="space-y-8"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('dashboard')}</h1>
          <p className="text-slate-500 mt-1">{t('welcomeBack')}</p>
        </div>
        <Link 
          to="/invoices/new" 
          className="bg-accent-600 hover:bg-accent-700 text-accent-fg px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2 text-sm"
        >
          <span>{t('createNewInvoice')}</span>
          <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:border-slate-300 transition-colors relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-2.5 bg-accent-50 rounded-xl text-accent-600 border border-accent-100/50">
                <TrendingUp size={20} />
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100/50">+12%</span>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">{t('totalRevenue')}</p>
            <h3 className="text-3xl font-bold text-slate-900 font-mono tracking-tight">{formatCurrency(totalRevenue)}</h3>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:border-slate-300 transition-colors relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
                <FileText size={20} />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">{t('invoices')}</p>
            <h3 className="text-3xl font-bold text-slate-900 font-mono tracking-tight">{invoices.length}</h3>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:border-slate-300 transition-colors relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
                <Users size={20} />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">{t('clients')}</p>
            <h3 className="text-3xl font-bold text-slate-900 font-mono tracking-tight">{clients.length}</h3>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:border-slate-300 transition-colors relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
                <Package size={20} />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">{t('products')}</p>
            <h3 className="text-3xl font-bold text-slate-900 font-mono tracking-tight">{products.length}</h3>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-base font-semibold text-slate-800">{t('recentInvoices')}</h2>
            <Link to="/invoices" className="text-sm text-accent-600 hover:text-accent-700 font-medium transition-colors">{t('viewAll')}</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-white text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 font-semibold">{t('invoiceNumber')}</th>
                  <th className="px-6 py-5 font-semibold">{t('client')}</th>
                  <th className="px-6 py-5 font-semibold">{t('date')}</th>
                  <th className="px-6 py-5 font-semibold">{t('amount')}</th>
                  <th className="px-6 py-5 font-semibold">{t('status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentInvoices.length > 0 ? (
                  recentInvoices.map((invoice) => {
                    const client = clients.find(c => c.id === invoice.clientId);
                    return (
                      <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                        <td className="px-6 py-5 text-sm font-medium text-slate-900 font-mono">{invoice.number}</td>
                        <td className="px-6 py-5 text-sm text-slate-600">{client?.name || '-'}</td>
                        <td className="px-6 py-5 text-sm text-slate-500">{new Date(invoice.date).toLocaleDateString(isRTL ? 'ar-DZ' : 'en-US')}</td>
                        <td className="px-6 py-5 text-sm font-semibold text-slate-900 font-mono">{formatCurrency(invoice.total)}</td>
                        <td className="px-6 py-5">{getStatusBadge(invoice.status)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                          <FileText size={24} className="text-slate-300" />
                        </div>
                        <p className="text-sm">{t('noInvoices')}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 flex flex-col">
          <h2 className="text-base font-semibold text-slate-800 mb-6">{t('summary')}</h2>
          
          <div className="flex-1 space-y-6">
            <div className="p-5 bg-rose-50/50 rounded-xl border border-rose-100/50 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-rose-600 mb-1">{t('unpaidInvoices')}</p>
                <p className="text-3xl font-bold text-rose-900 font-mono tracking-tight">{unpaidInvoices}</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                <FileText size={20} />
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t('quickActions')}</p>
              <div className="space-y-3">
                <Link to="/clients/new" className="flex items-center justify-between w-full py-3 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-200 transition-all">
                  <span>{t('addNewClient')}</span>
                  <Users size={16} className="text-slate-400" />
                </Link>
                <Link to="/products/new" className="flex items-center justify-between w-full py-3 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-200 transition-all">
                  <span>{t('addNewItem')}</span>
                  <Package size={16} className="text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
