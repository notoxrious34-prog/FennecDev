import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Plus, Search, FileText, Trash2, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';

const Invoices = () => {
  const { invoices, clients, settings, deleteInvoice, updateInvoiceStatus } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const navigate = useNavigate();
  const { t, isRTL, formatCurrency } = useTranslation();

  // Get unique years from invoices
  const availableYears = Array.from(new Set<number>(invoices.map(inv => new Date(inv.date).getFullYear()))).sort((a, b) => b - a);
  // If no invoices, at least show current year
  if (availableYears.length === 0) availableYears.push(new Date().getFullYear());

  const filteredInvoices = invoices.filter(invoice => {
    const client = clients.find(c => c.id === invoice.clientId);
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      invoice.number.toLowerCase().includes(searchLower) ||
      (client && (
        client.name.toLowerCase().includes(searchLower) ||
        (client.email && client.email.toLowerCase().includes(searchLower)) ||
        (client.phone && client.phone.toLowerCase().includes(searchLower))
      ));
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    const invoiceDate = new Date(invoice.date);
    const matchesMonth = monthFilter === 'all' || (invoiceDate.getMonth() + 1).toString() === monthFilter;
    const matchesYear = yearFilter === 'all' || invoiceDate.getFullYear().toString() === yearFilter;
    
    return matchesSearch && matchesStatus && matchesMonth && matchesYear;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">{t('paid')}</span>;
      case 'unpaid':
        return <span className="px-2 py-1 text-xs font-medium bg-rose-100 text-rose-800 rounded-full">{t('unpaid')}</span>;
      case 'partial':
        return <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">{t('partial')}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('invoices')}</h1>
        <Link 
          to="/invoices/new"
          className="bg-accent-600 hover:bg-accent-700 text-accent-fg px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2 text-sm"
        >
          <Plus size={18} />
          {t('createNewInvoice')}
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <input 
              type="text" 
              placeholder={t('searchInvoices')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isRTL ? 'pl-10 pr-4' : 'pr-10 pl-4'} py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm bg-white`}
            />
            <Search className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-3.5 text-slate-400`} size={18} />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <select 
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white text-sm"
            >
              <option value="all">{t('allMonths')}</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month.toString()}>
                  {new Date(2000, month - 1, 1).toLocaleString(isRTL ? 'ar-DZ' : 'en-US', { month: 'long' })}
                </option>
              ))}
            </select>

            <select 
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white text-sm"
            >
              <option value="all">{t('allYears')}</option>
              {availableYears.map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white min-w-[150px] text-sm"
            >
              <option value="all">{t('allStatuses')}</option>
              <option value="paid">{t('paid')}</option>
              <option value="unpaid">{t('unpaid')}</option>
              <option value="partial">{t('partial')}</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}>
            <thead className="bg-white text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 font-semibold whitespace-nowrap">{t('invoiceNumber')}</th>
                <th className="px-6 py-5 font-semibold">{t('client')}</th>
                <th className="px-6 py-5 font-semibold whitespace-nowrap">{t('date')}</th>
                <th className="px-6 py-5 font-semibold whitespace-nowrap">{t('amount')}</th>
                <th className="px-6 py-5 font-semibold whitespace-nowrap">{t('status')}</th>
                <th className="px-6 py-5 font-semibold text-center whitespace-nowrap">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => {
                  const client = clients.find(c => c.id === invoice.clientId);
                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 text-sm font-medium text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                            <FileText size={14} className="text-slate-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-mono">{invoice.number}</span>
                            <span className="text-xs text-slate-400 font-normal">
                              {invoice.documentType === 'receipt' ? t('receipt') : 
                               invoice.documentType === 'both' ? t('both') : t('invoice')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">{client?.name || t('deletedClient')}</td>
                      <td className="px-6 py-5 text-sm text-slate-500 whitespace-nowrap">{new Date(invoice.date).toLocaleDateString(isRTL ? 'ar-DZ' : 'en-US')}</td>
                      <td className="px-6 py-5 text-sm font-semibold text-slate-900 font-mono whitespace-nowrap">{formatCurrency(invoice.total)}</td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <select 
                          value={invoice.status}
                          onChange={(e) => updateInvoiceStatus(invoice.id, e.target.value as any)}
                          className={`text-xs font-medium rounded-md px-2.5 py-1.5 border focus:ring-0 cursor-pointer ${
                            invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                            invoice.status === 'unpaid' ? 'bg-rose-50 text-rose-700 border-rose-200/60' :
                            'bg-amber-50 text-amber-700 border-amber-200/60'
                          }`}
                        >
                          <option value="paid">{t('paid')}</option>
                          <option value="unpaid">{t('unpaid')}</option>
                          <option value="partial">{t('partial')}</option>
                        </select>
                      </td>
                      <td className="px-6 py-5 text-sm flex justify-center gap-2 whitespace-nowrap">
                        <button 
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                          className="p-2 text-slate-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                          title={t('view')}
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm(t('confirmDelete'))) {
                              deleteInvoice(invoice.id);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title={t('delete')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
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
      </div>
    </div>
  );
};

export default Invoices;
