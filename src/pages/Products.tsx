import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Plus, Edit2, Trash2, Search, Package } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

const Products = () => {
  const { products, addProduct, updateProduct, deleteProduct, settings } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const { t, isRTL, formatCurrency } = useTranslation();
  
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    category: 'product' as 'product' | 'service',
    unit: ''
  });

  const filteredProducts = products.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(searchLower) ||
           (p.unit && p.unit.toLowerCase().includes(searchLower));
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct(formData);
    }
    closeModal();
  };

  const openModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ name: product.name, price: product.price, category: product.category, unit: product.unit || '' });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', price: 0, category: 'product', unit: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', price: 0, category: 'product', unit: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('products')}</h1>
        <button 
          onClick={() => openModal()}
          className="bg-accent-600 hover:bg-accent-700 text-accent-fg px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2 text-sm"
        >
          <Plus size={18} />
          {t('addProductService')}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/30">
          <div className="relative max-w-md">
            <input 
              type="text" 
              placeholder={t('searchProducts')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isRTL ? 'pl-10 pr-4' : 'pr-10 pl-4'} py-3 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm bg-white`}
            />
            <Search className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-3.5 text-slate-400`} size={18} />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}>
            <thead className="bg-white text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 font-semibold">{t('name')}</th>
                <th className="px-6 py-5 font-semibold whitespace-nowrap">{t('type')}</th>
                <th className="px-6 py-5 font-semibold whitespace-nowrap">{t('unit')}</th>
                <th className="px-6 py-5 font-semibold whitespace-nowrap">{t('price')}</th>
                <th className="px-6 py-5 font-semibold text-center whitespace-nowrap">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 text-sm font-medium text-slate-900">{product.name}</td>
                    <td className="px-6 py-5 text-sm text-slate-600 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                        product.category === 'product' ? 'bg-blue-50 text-blue-700 border-blue-200/60' : 
                        product.category === 'service' ? 'bg-purple-50 text-purple-700 border-purple-200/60' :
                        'bg-amber-50 text-amber-700 border-amber-200/60'
                      }`}>
                        {product.category === 'product' ? t('product') : 
                         product.category === 'service' ? t('service') : t('commodity')}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 whitespace-nowrap">{product.unit || '-'}</td>
                    <td className="px-6 py-5 text-sm font-semibold text-slate-900 font-mono whitespace-nowrap" dir="ltr">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-5 text-sm flex justify-center gap-2 whitespace-nowrap">
                      <button 
                        onClick={() => openModal(product)}
                        className="p-2 text-slate-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                        title={t('edit')}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(t('confirmDelete'))) {
                            deleteProduct(product.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                        <Package size={24} className="text-slate-300" />
                      </div>
                      <p className="text-sm">{t('noProducts')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingProduct ? t('editItem') : t('addNewItem')}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('name')}</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('type')}</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as 'product' | 'service' | 'commodity'})}
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
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
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
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                  dir="ltr"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
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

export default Products;
