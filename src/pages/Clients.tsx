import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Plus, Edit2, Trash2, Search, Users } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

const Clients = () => {
  const { clients, addClient, updateClient, deleteClient } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<any>(null);
  const { t, isRTL } = useTranslation();
  
  const [formData, setFormData] = useState({
    type: 'individual' as 'individual' | 'company',
    name: '',
    phone: '',
    address: '',
    email: '',
    nif: '',
    nis: '',
    rc: '',
    ai: ''
  });

  const filteredClients = clients.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(searchLower) ||
           (c.phone && c.phone.includes(searchTerm)) ||
           (c.email && c.email.toLowerCase().includes(searchLower)) ||
           (c.nif && c.nif.toLowerCase().includes(searchLower)) ||
           (c.rc && c.rc.toLowerCase().includes(searchLower));
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      updateClient(editingClient.id, formData);
    } else {
      addClient(formData);
    }
    closeModal();
  };

  const openModal = (client?: any) => {
    if (client) {
      setEditingClient(client);
      setFormData({ 
        type: client.type || 'individual',
        name: client.name, 
        phone: client.phone, 
        address: client.address, 
        email: client.email || '',
        nif: client.nif || '',
        nis: client.nis || '',
        rc: client.rc || '',
        ai: client.ai || ''
      });
    } else {
      setEditingClient(null);
      setFormData({ type: 'individual', name: '', phone: '', address: '', email: '', nif: '', nis: '', rc: '', ai: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({ type: 'individual', name: '', phone: '', address: '', email: '', nif: '', nis: '', rc: '', ai: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('clients')}</h1>
        <button 
          onClick={() => openModal()}
          className="bg-accent-600 hover:bg-accent-700 text-accent-fg px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2 text-sm"
        >
          <Plus size={18} />
          {t('addClient')}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/30">
          <div className="relative max-w-md">
            <input 
              type="text" 
              placeholder={t('searchClients')} 
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
                <th className="px-6 py-5 font-semibold whitespace-nowrap">{t('type')}</th>
                <th className="px-6 py-5 font-semibold">{t('name')}</th>
                <th className="px-6 py-5 font-semibold whitespace-nowrap">{t('phone')}</th>
                <th className="px-6 py-5 font-semibold whitespace-nowrap">{t('email')}</th>
                <th className="px-6 py-5 font-semibold">{t('address')}</th>
                <th className="px-6 py-5 font-semibold text-center whitespace-nowrap">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 text-sm text-slate-600 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                        (!client.type || client.type === 'individual') ? 'bg-blue-50 text-blue-700 border-blue-200/60' : 'bg-purple-50 text-purple-700 border-purple-200/60'
                      }`}>
                        {(!client.type || client.type === 'individual') ? t('individual') : t('company')}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-900">{client.name}</td>
                    <td className="px-6 py-5 text-sm text-slate-600 font-mono whitespace-nowrap" dir="ltr">{client.phone}</td>
                    <td className="px-6 py-5 text-sm text-slate-600 whitespace-nowrap" dir="ltr">{client.email || '-'}</td>
                    <td className="px-6 py-5 text-sm text-slate-600">{client.address}</td>
                    <td className="px-6 py-5 text-sm flex justify-center gap-2 whitespace-nowrap">
                      <button 
                        onClick={() => openModal(client)}
                        className="p-2 text-slate-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                        title={t('edit')}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(t('confirmDelete'))) {
                            deleteClient(client.id);
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
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                        <Users size={24} className="text-slate-300" />
                      </div>
                      <p className="text-sm">{t('noClients')}</p>
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-slate-800">
                {editingClient ? t('editClient') : t('addNewClient')}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex gap-4 mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="clientType"
                    value="individual"
                    checked={formData.type === 'individual'}
                    onChange={() => setFormData({...formData, type: 'individual'})}
                    className="text-accent-600 focus:ring-accent-500"
                  />
                  <span className="text-sm font-medium text-slate-700">{t('individual')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="clientType"
                    value="company"
                    checked={formData.type === 'company'}
                    onChange={() => setFormData({...formData, type: 'company'})}
                    className="text-accent-600 focus:ring-accent-500"
                  />
                  <span className="text-sm font-medium text-slate-700">{t('company')}</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('name')}
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('phone')}</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('email')}</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                    dir="ltr"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('address')}</label>
                  <textarea 
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                  ></textarea>
                </div>
              </div>

              {formData.type === 'company' && (
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">{t('taxLegalInfo')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('nif')}</label>
                      <input 
                        type="text" 
                        value={formData.nif}
                        onChange={(e) => setFormData({...formData, nif: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('nis')}</label>
                      <input 
                        type="text" 
                        value={formData.nis}
                        onChange={(e) => setFormData({...formData, nis: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('rc')}</label>
                      <input 
                        type="text" 
                        value={formData.rc}
                        onChange={(e) => setFormData({...formData, rc: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('ai')}</label>
                      <input 
                        type="text" 
                        value={formData.ai}
                        onChange={(e) => setFormData({...formData, ai: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
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

export default Clients;
