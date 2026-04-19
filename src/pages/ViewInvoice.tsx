import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { ArrowRight, ArrowLeft, Printer, Download, Mail, Settings2 } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ViewInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoices, clients, settings } = useAppContext();
  const { t, isRTL, formatCurrency } = useTranslation();
  
  const [showTax, setShowTax] = useState(true);
  const [showDiscount, setShowDiscount] = useState(true);
  const [showUnitPrice, setShowUnitPrice] = useState(true);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const invoice = invoices.find(i => i.id === id);
  const client = invoice ? clients.find(c => c.id === invoice.clientId) : null;

  const [viewType, setViewType] = useState<'invoice' | 'receipt'>(invoice?.documentType === 'receipt' ? 'receipt' : 'invoice');

  // Reset showUnitPrice when switching view types
  useEffect(() => {
    if (viewType === 'receipt') {
      setShowUnitPrice(false);
    } else {
      setShowUnitPrice(true);
    }
  }, [viewType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPrintOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!invoice || !client) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('invoiceNotFound')}</h2>
        <button 
          onClick={() => navigate('/invoices')}
          className="text-accent-600 hover:underline"
        >
          {t('backToInvoices')}
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const generatePdfBlob = async () => {
    const element = document.getElementById('invoice-document');
    if (!element) return null;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        ignoreElements: (element) => element.classList.contains('no-print')
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(t('errorGeneratingPdf'));
      return null;
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = await generatePdfBlob();
      if (pdf) {
        const fileName = `${viewType === 'receipt' ? 'Receipt' : 'Invoice'}_${invoice.number}.pdf`;
        pdf.save(fileName);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSendEmail = async () => {
    if (!client?.email) {
      alert(t('emailRequired'));
      return;
    }

    try {
      setIsGeneratingPdf(true);
      const pdf = await generatePdfBlob();
      if (pdf) {
        // We can't attach files to mailto directly, so we just open the mail client
        // and let the user know they can attach the downloaded PDF if they want.
        // Or we can just download it for them to attach.
        
        // For now, let's just download it and open mailto
        const fileName = `${viewType === 'receipt' ? 'Receipt' : 'Invoice'}_${invoice.number}.pdf`;
        pdf.save(fileName);
        
        const subject = encodeURIComponent(
          t('emailSubject')
            .replace('{number}', invoice.number)
            .replace('{store}', settings.name)
        );
        
        const body = encodeURIComponent(
          t('emailBody')
            .replace('{client}', client.name)
            .replace('{number}', invoice.number)
            .replace('{total}', formatCurrency(displayTotal))
            .replace('{url}', window.location.href)
            .replace('{store}', settings.name)
        );
    
        window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`;
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const taxAmount = (invoice.subtotal * invoice.tax) / 100;
  const displayTaxAmount = showTax ? taxAmount : 0;
  const displayDiscount = showDiscount ? invoice.discount : 0;
  let displayTotal = invoice.subtotal + displayTaxAmount - displayDiscount;
  const stampDutyAmount = invoice.stampDuty ? displayTotal * 0.01 : 0;
  displayTotal += stampDutyAmount;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Actions Bar (No Print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 no-print">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/invoices')}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600"
          >
            {isRTL ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('view')} {viewType === 'receipt' ? t('receipt') : t('invoice')}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {invoice.documentType === 'both' && (
            <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setViewType('invoice')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewType === 'invoice' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t('invoice')}
              </button>
              <button
                onClick={() => setViewType('receipt')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewType === 'receipt' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t('receipt')}
              </button>
            </div>
          )}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowPrintOptions(!showPrintOptions)}
              className="bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm border border-slate-200/80 text-sm"
            >
              <Settings2 size={18} />
              {t('printOptions')}
            </button>
            
            {showPrintOptions && (
              <div className={`absolute top-full ${isRTL ? 'right-0' : 'left-0'} mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/60 p-4 z-10`}>
                <h3 className="text-sm font-semibold text-slate-800 mb-3">{t('includeInPrint')}:</h3>
                <div className="space-y-3">
                  {invoice.tax > 0 && (
                    <label className="flex items-center gap-2.5 text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={showTax} 
                        onChange={(e) => setShowTax(e.target.checked)}
                        className="rounded border-slate-300 text-accent-600 focus:ring-accent-600 w-4 h-4"
                      />
                      {t('tax')} (TVA)
                    </label>
                  )}
                  {invoice.discount > 0 && (
                    <label className="flex items-center gap-2.5 text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={showDiscount} 
                        onChange={(e) => setShowDiscount(e.target.checked)}
                        className="rounded border-slate-300 text-accent-600 focus:ring-accent-600 w-4 h-4"
                      />
                      {t('discount')}
                    </label>
                  )}
                  {invoice.tax === 0 && invoice.discount === 0 && viewType !== 'receipt' && (
                    <p className="text-xs text-slate-400">{t('noTaxOrDiscount')}</p>
                  )}
                  {viewType === 'receipt' && (
                    <label className="flex items-center gap-2.5 text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={showUnitPrice} 
                        onChange={(e) => setShowUnitPrice(e.target.checked)}
                        className="rounded border-slate-300 text-accent-600 focus:ring-accent-600 w-4 h-4"
                      />
                      {t('showUnitPrice')}
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={handleSendEmail}
            disabled={isGeneratingPdf}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Mail size={18} />
            {isGeneratingPdf ? t('generatingPdf') : t('sendEmail')}
          </button>
          <button 
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Download size={18} />
            {t('downloadPdf')}
          </button>
          <button 
            onClick={handlePrint}
            className="bg-accent-600 hover:bg-accent-700 text-accent-fg px-6 py-2.5 rounded-xl font-medium transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center gap-2 text-sm"
          >
            <Printer size={18} />
            {t('printPdf')}
          </button>
        </div>
      </div>

      {/* Invoice Document */}
      <div 
        id="invoice-document" 
        className="bg-white rounded-2xl border border-slate-200/60 p-10 md:p-14 shadow-sm print:shadow-none print:border-none print:p-0" 
        style={{ 
          backgroundColor: '#ffffff', 
          borderColor: '#e2e8f0',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-10 mb-10" style={{ borderColor: '#f1f5f9' }}>
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: '#0f172a' }}>
              {viewType === 'receipt' ? t('receipt') : t('invoice')}
            </h1>
            <p className="font-mono text-sm tracking-widest uppercase" style={{ color: '#64748b' }} dir="ltr">
              {viewType === 'receipt' ? `BL ${invoice.number}` : invoice.number}
            </p>
          </div>
          <div className={`text-${isRTL ? 'left' : 'right'}`}>
            <h2 className="text-xl font-bold mb-1.5" style={{ color: '#0f172a' }}>{settings.name}</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{settings.address}</p>
            <p className="text-sm leading-relaxed" style={{ color: '#475569' }} dir="ltr">{settings.phone}</p>
            <p className="text-sm leading-relaxed" style={{ color: '#475569' }} dir="ltr">{settings.email}</p>
            
            {viewType === 'invoice' && (settings.nif || settings.nis || settings.rc || settings.ai || settings.bankAccount) && (
              <div className="mt-4 pt-4 border-t border-slate-100 text-xs space-y-1.5 font-mono" style={{ borderColor: '#f1f5f9', color: '#64748b' }}>
                {settings.nif && <p>NIF: <span dir="ltr" className="text-slate-900">{settings.nif}</span></p>}
                {settings.nis && <p>NIS: <span dir="ltr" className="text-slate-900">{settings.nis}</span></p>}
                {settings.rc && <p>RC: <span dir="ltr" className="text-slate-900">{settings.rc}</span></p>}
                {settings.ai && <p>AI: <span dir="ltr" className="text-slate-900">{settings.ai}</span></p>}
                {settings.bankAccount && <p>RIB/RIP: <span dir="ltr" className="text-slate-900">{settings.bankAccount}</span></p>}
              </div>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-10 mb-10">
          <div>
            <p className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: '#94a3b8' }}>{t('billedTo')}</p>
            <h3 className="text-lg font-semibold mb-1.5" style={{ color: '#0f172a' }}>{client.name}</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{client.address}</p>
            <p className="text-sm leading-relaxed mt-1" style={{ color: '#475569' }} dir="ltr">{client.phone}</p>
            {client.email && <p className="text-sm leading-relaxed" style={{ color: '#475569' }} dir="ltr">{client.email}</p>}
            
            {viewType === 'invoice' && client.type === 'company' && (client.nif || client.nis || client.rc || client.ai) && (
              <div className="mt-4 pt-4 border-t border-slate-100 text-xs space-y-1.5 font-mono" style={{ borderColor: '#f1f5f9', color: '#64748b' }}>
                {client.nif && <p>NIF: <span dir="ltr" className="text-slate-900">{client.nif}</span></p>}
                {client.nis && <p>NIS: <span dir="ltr" className="text-slate-900">{client.nis}</span></p>}
                {client.rc && <p>RC: <span dir="ltr" className="text-slate-900">{client.rc}</span></p>}
                {client.ai && <p>AI: <span dir="ltr" className="text-slate-900">{client.ai}</span></p>}
              </div>
            )}
          </div>
          <div className={`text-${isRTL ? 'left' : 'right'}`}>
            <div className="mb-5">
              <p className="text-xs font-semibold mb-1.5 uppercase tracking-widest" style={{ color: '#94a3b8' }}>{t('issueDate')}</p>
              <p className="font-medium text-sm" style={{ color: '#0f172a' }}>{new Date(invoice.date).toLocaleDateString(isRTL ? 'ar-DZ' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            {invoice.dueDate && (
              <div>
                <p className="text-xs font-semibold mb-1.5 uppercase tracking-widest" style={{ color: '#94a3b8' }}>{t('dueDate')}</p>
                <p className="font-medium text-sm" style={{ color: '#0f172a' }}>{new Date(invoice.dueDate).toLocaleDateString(isRTL ? 'ar-DZ' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            )}
            {invoice.paymentMethod && (
              <div className="mt-5">
                <p className="text-xs font-semibold mb-1.5 uppercase tracking-widest" style={{ color: '#94a3b8' }}>{t('paymentMethod')}</p>
                <p className="font-medium text-sm" style={{ color: '#0f172a' }}>
                  {invoice.paymentMethod === 'cash' ? t('cash') :
                   invoice.paymentMethod === 'check' ? t('check') :
                   invoice.paymentMethod === 'transfer' ? t('transfer') : t('other')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-10">
          <table className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="border-b border-slate-200" style={{ borderColor: '#e2e8f0' }}>
                <th className="py-5 text-xs font-semibold uppercase tracking-wider w-2/5" style={{ color: '#64748b' }}>{t('description')}</th>
                <th className="py-5 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: '#64748b' }}>{t('unit')}</th>
                <th className="py-5 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: '#64748b' }}>{t('quantity')}</th>
                {showUnitPrice && <th className={`py-5 text-xs font-semibold uppercase tracking-wider text-${isRTL ? 'left' : 'right'}`} style={{ color: '#64748b' }}>{t('price')}</th>}
                <th className={`py-5 text-xs font-semibold uppercase tracking-wider text-${isRTL ? 'left' : 'right'}`} style={{ color: '#64748b' }}>{t('total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item, index) => (
                <tr key={item.id} style={{ borderColor: '#f1f5f9' }}>
                  <td className="py-6 font-medium text-sm" style={{ color: '#0f172a' }}>{item.name}</td>
                  <td className="py-6 text-center text-sm" style={{ color: '#64748b' }}>{item.unit || '-'}</td>
                  <td className="py-6 text-center text-sm font-mono" style={{ color: '#475569' }} dir="ltr">
                    {item.quantity}
                    {(item.unit === 'm²' || item.unit === 'm2') && item.width && item.height && (
                      <div className="text-xs text-slate-400 mt-1.5 font-sans">
                        ({item.width} x {item.height})
                      </div>
                    )}
                  </td>
                  {showUnitPrice && <td className={`py-6 text-sm font-mono text-${isRTL ? 'left' : 'right'}`} style={{ color: '#475569' }} dir="ltr">{formatCurrency(item.price)}</td>}
                  <td className={`py-6 font-semibold text-sm font-mono text-${isRTL ? 'left' : 'right'}`} style={{ color: '#0f172a' }} dir="ltr">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className={`flex justify-${isRTL ? 'end' : 'end'} mb-12`}>
          <div className="w-full md:w-1/2 lg:w-2/5 space-y-4">
            <div className="flex justify-between text-sm" style={{ color: '#475569' }}>
              <span>{t('subtotalHt')}</span>
              <span className="font-mono" dir="ltr">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.tax > 0 && showTax && (
              <div className="flex justify-between text-sm" style={{ color: '#475569' }}>
                <span>{t('taxTva')} ({invoice.tax}%)</span>
                <span className="font-mono" dir="ltr">{formatCurrency(taxAmount)}</span>
              </div>
            )}
            {invoice.discount > 0 && showDiscount && (
              <div className="flex justify-between text-sm" style={{ color: '#475569' }}>
                <span>{t('discount')}</span>
                <span className="font-mono" dir="ltr">-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            {invoice.stampDuty && (
              <div className="flex justify-between text-sm" style={{ color: '#475569' }}>
                <span>{t('stampDuty')}</span>
                <span className="font-mono" dir="ltr">{formatCurrency(stampDutyAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-slate-200 pt-4 mt-4" style={{ borderColor: '#e2e8f0' }}>
              <span className="text-base font-bold" style={{ color: '#0f172a' }}>{t('totalTtc')}</span>
              <span className="text-2xl font-bold tracking-tight font-mono" style={{ color: '#0f172a' }} dir="ltr">{formatCurrency(displayTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-8 text-center" style={{ borderColor: '#f1f5f9' }}>
          {invoice.notes && <p className="mb-3 font-medium text-sm" style={{ color: '#0f172a' }}>{invoice.notes}</p>}
          <p className="text-xs uppercase tracking-widest" style={{ color: '#94a3b8' }}>{t('thankYou')}</p>
        </div>
      </div>
    </div>
  );
};

export default ViewInvoice;
