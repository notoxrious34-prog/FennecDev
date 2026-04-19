import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { Plus, Trash2, Save, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InvoiceItem } from '../types';
import { useTranslation } from '../i18n/useTranslation';

const CreateInvoice = () => {
  const { clients, products, settings, addInvoice, invoices, addClient, addProduct } = useAppContext();
  const navigate = useNavigate();
  const { t, isRTL, formatCurrency } = useTranslation();

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString();
    const count = (invoices.length + 1).toString().padStart(4, '0');
    return `${count}/${year}`;
  };

  const [formData, setFormData] = useState({
    number: generateInvoiceNumber(),
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
    status: 'unpaid' as 'paid' | 'unpaid' | 'partial',
    notes: t('defaultNotes'),
    tax: settings.taxRate,
    stampDuty: false,
    discount: 0,
    paymentMethod: 'cash' as 'cash' | 'check' | 'transfer' | 'other',
    documentType: 'invoice' as 'invoice' | 'receipt' | 'both'
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientFormData, setClientFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    type: 'individual' as 'individual' | 'company',
    nif: '',
    nis: '',
    rc: '',
    ai: ''
  });

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [addingProductForItem, setAddingProductForItem] = useState<string | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    price: 0,
    category: 'product' as 'product' | 'service',
    unit: ''
  });

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * formData.tax) / 100;
    let total = subtotal + taxAmount - formData.discount;
    const stampDutyAmount = formData.stampDuty ? total * 0.01 : 0;
    total += stampDutyAmount;
    return { subtotal, taxAmount, stampDutyAmount, total };
  };

  const { subtotal, taxAmount, stampDutyAmount, total } = calculateTotals();

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: crypto.randomUUID(), productId: '', name: '', quantity: 1, price: 0, total: 0, unit: '' }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-fill product details if productId changes
        if (field === 'productId' && value) {
          const product = products.find(p => p.id === value);
          if (product) {
            updatedItem.name = product.name;
            updatedItem.price = product.price;
            updatedItem.unit = product.unit || '';
            
            // Reset dimensions if unit is not m²
            if (updatedItem.unit !== 'm²' && updatedItem.unit !== 'm2') {
              updatedItem.width = undefined;
              updatedItem.height = undefined;
            }
          }
        }
        
        // Calculate quantity if unit is m² and width/height changes
        if (updatedItem.unit === 'm²' || updatedItem.unit === 'm2') {
          if (field === 'width' || field === 'height' || field === 'unit') {
            const w = updatedItem.width || 0;
            const h = updatedItem.height || 0;
            if (w > 0 && h > 0) {
              updatedItem.quantity = parseFloat((w * h).toFixed(2));
            }
          }
        } else if (field === 'unit') {
          // If unit changed FROM m² to something else, reset width/height
          updatedItem.width = undefined;
          updatedItem.height = undefined;
        }
        
        // Recalculate total
        if (field === 'quantity' || field === 'price' || field === 'productId' || field === 'width' || field === 'height' || field === 'unit') {
          updatedItem.total = updatedItem.quantity * updatedItem.price;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) {
      alert(t('selectClientWarning'));
      return;
    }
    if (items.length === 0) {
      alert(t('addAtLeastOneItemWarning'));
      return;
    }
    
    // Check if any item has empty name or 0 total
    const invalidItems = items.filter(i => !i.name.trim() || i.total <= 0);
    if (invalidItems.length > 0) {
      alert(t('invalidItemsWarning'));
      return;
    }

    addInvoice({
      ...formData,
      items,
      subtotal,
      total
    });

    navigate('/invoices');
  };

  const handleAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newClientId = addClient(clientFormData);
    setFormData({ ...formData, clientId: newClientId });
    setIsClientModalOpen(false);
    setClientFormData({
      name: '', email: '', phone: '', address: '', type: 'individual', nif: '', nis: '', rc: '', ai: ''
    });
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProductId = addProduct(productFormData);
    
    if (addingProductForItem) {
      handleItemChange(addingProductForItem, 'productId', newProductId);
    }
    
    setIsProductModalOpen(false);
    setAddingProductForItem(null);
    setProductFormData({ name: '', price: 0, category: 'product', unit: '' });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/invoices')}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600"
        >
          {isRTL ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('createNewInvoice')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-3">{t('invoiceDetails')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-11 gap-5">
            <div className="md:col-span-1 lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('documentType')}</label>
              <select 
                value={formData.documentType}
                onChange={(e) => setFormData({...formData, documentType: e.target.value as any})}
                className="w-full px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white text-sm"
              >
                <option value="invoice">{t('invoice')}</option>
                <option value="receipt">{t('receipt')}</option>
                <option value="both">{t('both')}</option>
              </select>
            </div>
            <div className="md:col-span-1 lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('invoiceNumber')}</label>
              <input 
                type="text" 
                required
                value={formData.number}
                onChange={(e) => setFormData({...formData, number: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-slate-50 text-sm font-mono"
                dir="ltr"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('client')}</label>
              <div className="flex gap-2">
                <select 
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                  className="flex-1 px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white text-sm"
                >
                  <option value="">{t('selectClient')}</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(true)}
                  className="p-2.5 bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl hover:bg-slate-100 transition-colors"
                  title={t('addNewClient')}
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
            <div className="md:col-span-1 lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('issueDate')}</label>
              <input 
                type="date" 
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm bg-white"
              />
            </div>
            <div className="md:col-span-1 lg:col-span-2">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-slate-700">{t('dueDate')}</label>
                <label className="flex items-center cursor-pointer" title={t('none')}>
                  <input 
                    type="checkbox" 
                    checked={formData.dueDate === ''}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.checked ? '' : new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0]})}
                    className="rounded border-slate-300 text-accent-600 focus:ring-accent-600 w-4 h-4"
                  />
                </label>
              </div>
              <input 
                type="date" 
                disabled={formData.dueDate === ''}
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">{t('productsAndServices')}</h2>
            <button 
              type="button"
              onClick={handleAddItem}
              className="text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1.5 text-sm bg-white border border-slate-200/80 px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              <Plus size={16} />
              {t('addItem')}
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className={`w-full ${isRTL ? 'text-right' : 'text-left'} min-w-[800px]`}>
              <thead className="bg-white text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-5 font-semibold w-1/4">{t('productService')}</th>
                  <th className="px-5 py-5 font-semibold w-1/3">{t('description')}</th>
                  <th className="px-5 py-5 font-semibold w-20">{t('unit')}</th>
                  <th className="px-5 py-5 font-semibold min-w-[180px]">{t('quantity')}</th>
                  <th className="px-5 py-5 font-semibold w-32">{t('price')}</th>
                  <th className="px-5 py-5 font-semibold w-32">{t('total')}</th>
                  <th className="px-5 py-5 font-semibold w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-5 py-5">
                      <div className="flex gap-2">
                        <select 
                          value={item.productId}
                          onChange={(e) => handleItemChange(item.id, 'productId', e.target.value)}
                          className="flex-1 px-3 py-2.5 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white text-sm"
                        >
                          <option value="">{t('customItem')}</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>{product.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingProductForItem(item.id);
                            setIsProductModalOpen(true);
                          }}
                          className="p-2.5 bg-slate-50 text-slate-600 border border-slate-200/80 rounded-lg hover:bg-slate-100 transition-colors"
                          title={t('addNewItem')}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <input 
                        type="text" 
                        required
                        placeholder={t('description')}
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm bg-white"
                      />
                    </td>
                    <td className="px-5 py-5">
                      <input 
                        type="text" 
                        placeholder={t('unit')}
                        value={item.unit || ''}
                        onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                        className="w-24 px-3 py-2.5 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm bg-white"
                      />
                    </td>
                    <td className="px-5 py-5">
                      {(item.unit === 'm²' || item.unit === 'm2') ? (
                        <div className="flex gap-1.5 items-center">
                          <input 
                            type="number" 
                            min="0"
                            step="0.01"
                            placeholder={t('width')}
                            value={item.width || ''}
                            onChange={(e) => handleItemChange(item.id, 'width', parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-2.5 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 text-xs font-mono bg-white"
                            dir="ltr"
                          />
                          <span className="text-slate-400 text-xs">x</span>
                          <input 
                            type="number" 
                            min="0"
                            step="0.01"
                            placeholder={t('height')}
                            value={item.height || ''}
                            onChange={(e) => handleItemChange(item.id, 'height', parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-2.5 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 text-xs font-mono bg-white"
                            dir="ltr"
                          />
                          <span className="text-slate-400 text-xs">=</span>
                          <span className="font-medium text-slate-700 min-w-[3rem] text-center bg-slate-50 py-2.5 rounded-lg font-mono text-xs border border-slate-100" dir="ltr">{item.quantity}</span>
                        </div>
                      ) : (
                        <input 
                          type="number" 
                          min="1"
                          required
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-20 px-3 py-2.5 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm font-mono bg-white"
                          dir="ltr"
                        />
                      )}
                    </td>
                    <td className="px-5 py-5">
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={item.price || ''}
                        onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-28 px-3 py-2.5 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm font-mono bg-white"
                        dir="ltr"
                      />
                    </td>
                    <td className="px-5 py-5 font-semibold text-slate-900 font-mono text-sm">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="px-5 py-5 text-center">
                      <button 
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                          <Plus size={20} className="text-slate-300" />
                        </div>
                        <p>{t('noItemsAdded')}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-3">{t('notes')}</h2>
            <textarea 
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm resize-none bg-white"
              placeholder={t('additionalNotes')}
            ></textarea>
            
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('paymentStatus')}</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  className="w-full px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white text-sm"
                >
                  <option value="unpaid">{t('unpaid')}</option>
                  <option value="partial">{t('partial')}</option>
                  <option value="paid">{t('paid')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('paymentMethod')}</label>
                <select 
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as any})}
                  className="w-full px-4 py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white text-sm"
                >
                  <option value="cash">{t('cash')}</option>
                  <option value="check">{t('check')}</option>
                  <option value="transfer">{t('transfer')}</option>
                  <option value="other">{t('other')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-3">{t('summary')}</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-sm">{t('subtotal')}</span>
                <span className="font-medium font-mono" dir="ltr">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{t('tax')} (TVA)</span>
                  <div className="relative flex items-center">
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={formData.tax || ''}
                      onChange={(e) => setFormData({...formData, tax: parseFloat(e.target.value) || 0})}
                      className="w-20 px-3 py-1.5 border border-slate-200/80 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-accent-500 font-mono bg-white"
                      dir="ltr"
                    />
                    <span className="absolute right-2 text-slate-400 text-sm">%</span>
                  </div>
                </div>
                <span className="font-medium font-mono" dir="ltr">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-sm">{t('discount')}</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="0"
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                    className="w-24 px-3 py-1.5 border border-slate-200/80 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-accent-500 font-mono bg-white"
                    dir="ltr"
                  />
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{settings.currency}</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.stampDuty}
                    onChange={(e) => setFormData({...formData, stampDuty: e.target.checked})}
                    className="rounded border-slate-300 text-accent-600 focus:ring-accent-600 w-4 h-4"
                  />
                  <span className="text-sm">{t('stampDuty')}</span>
                </label>
                {formData.stampDuty && (
                  <span className="font-medium font-mono" dir="ltr">{formatCurrency(stampDutyAmount)}</span>
                )}
              </div>
              <div className="pt-5 mt-5 border-t border-slate-100 flex justify-between items-center">
                <span className="text-lg font-bold text-slate-900">{t('totalAmount')}</span>
                <span className="text-2xl font-bold text-accent-600 font-mono tracking-tight" dir="ltr">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`fixed bottom-0 ${isRTL ? 'left-0 right-0 md:right-64' : 'right-0 left-0 md:left-64'} bg-white/80 backdrop-blur-md border-t border-slate-200/60 p-4 flex justify-end gap-4 z-20`}>
          <button 
            type="button"
            onClick={() => navigate('/invoices')}
            className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors text-sm"
          >
            {t('cancel')}
          </button>
          <button 
            type="submit"
            className="px-6 py-2.5 bg-accent-600 hover:bg-accent-700 text-accent-fg rounded-xl font-medium transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center gap-2 text-sm"
          >
            <Save size={18} />
            {t('saveInvoice')}
          </button>
        </div>
      </form>

      {/* Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800">{t('addNewClient')}</h2>
              <button onClick={() => setIsClientModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleAddClientSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('name')}</label>
                  <input 
                    type="text" 
                    required
                    value={clientFormData.name}
                    onChange={(e) => setClientFormData({...clientFormData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('type')}</label>
                  <select 
                    value={clientFormData.type}
                    onChange={(e) => setClientFormData({...clientFormData, type: e.target.value as 'individual' | 'company'})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
                  >
                    <option value="individual">{t('individual')}</option>
                    <option value="company">{t('company')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('phone')}</label>
                  <input 
                    type="text" 
                    value={clientFormData.phone}
                    onChange={(e) => setClientFormData({...clientFormData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('email')}</label>
                  <input 
                    type="email" 
                    value={clientFormData.email}
                    onChange={(e) => setClientFormData({...clientFormData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                    dir="ltr"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('address')}</label>
                  <input 
                    type="text" 
                    value={clientFormData.address}
                    onChange={(e) => setClientFormData({...clientFormData, address: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
              </div>

              {clientFormData.type === 'company' && (
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-lg font-medium text-slate-800 mb-4">{t('taxLegalInfo')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('nif')}</label>
                      <input 
                        type="text" 
                        value={clientFormData.nif}
                        onChange={(e) => setClientFormData({...clientFormData, nif: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('nis')}</label>
                      <input 
                        type="text" 
                        value={clientFormData.nis}
                        onChange={(e) => setClientFormData({...clientFormData, nis: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('rc')}</label>
                      <input 
                        type="text" 
                        value={clientFormData.rc}
                        onChange={(e) => setClientFormData({...clientFormData, rc: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('ai')}</label>
                      <input 
                        type="text" 
                        value={clientFormData.ai}
                        onChange={(e) => setClientFormData({...clientFormData, ai: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-accent-fg rounded-xl font-medium transition-colors"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">{t('addNewItem')}</h2>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleAddProductSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('name')}</label>
                <input 
                  type="text" 
                  required
                  value={productFormData.name}
                  onChange={(e) => setProductFormData({...productFormData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('type')}</label>
                <select 
                  value={productFormData.category}
                  onChange={(e) => setProductFormData({...productFormData, category: e.target.value as 'product' | 'service' | 'commodity'})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
                >
                  <option value="product">{t('product')}</option>
                  <option value="service">{t('service')}</option>
                  <option value="commodity">{t('commodity')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('unit')} {t('optional')}</label>
                <input 
                  type="text" 
                  value={productFormData.unit}
                  onChange={(e) => setProductFormData({...productFormData, unit: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder={`${t('example')} kg, m, pcs...`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('price')} ({settings.currency})</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  required
                  value={productFormData.price}
                  onChange={(e) => setProductFormData({...productFormData, price: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                  dir="ltr"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-accent-fg rounded-xl font-medium transition-colors"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateInvoice;
