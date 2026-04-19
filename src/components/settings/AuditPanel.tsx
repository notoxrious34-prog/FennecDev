import React, { useState } from 'react';
import { useAuditLog } from '../../hooks/useAuditLog';
import { useTranslation } from '../../i18n/useTranslation';
import { formatDate } from '../../utils/dateUtils';
import { Shield, Filter, Download, ChevronRight, Search, Calendar, FileText, Package, Users, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AuditPanel = () => {
  const { t, lang, isRTL } = useTranslation();
  const { logs, isLoading, error, filters, setFilters } = useAuditLog();
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleViewDetail = (log: any) => {
    setSelectedLog(log);
    setIsDrawerOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Action', 'Entity', 'EntityID', 'User', 'Payload'];
    const rows = logs.map(l => [
      l.timestamp,
      l.action,
      l.entity,
      l.entityId,
      l.userId,
      JSON.stringify(l.payload).replace(/"/g, '""')
    ]);
    const csv = [headers, ...rows].map(r => r.map(f => `"${f}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ActionBadge = ({ action }: { action: string }) => {
    const config = {
      CREATE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/60' },
      UPDATE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60' },
      DELETE: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/60' },
    };
    const c = config[action as keyof typeof config] || config.CREATE;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-md border ${c.bg} ${c.text} ${c.border}`}>
        {t(`settings.audit.actions.${action.toLowerCase()}` as any)}
      </span>
    );
  };

  const EntityIcon = ({ entity }: { entity: string }) => {
    const icons: Record<string, any> = {
      invoice: FileText,
      product: Package,
      client: Users,
      supplier: User,
    };
    const Icon = icons[entity] || FileText;
    return <Icon size={16} className="text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="text-slate-500" size={24} />
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t('settings.audit.title')}</h2>
          <p className="text-sm text-slate-500">{t('settings.audit.subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('settings.audit.filterAction')}</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white text-sm"
            >
              <option value="ALL">{t('settings.audit.actions.all')}</option>
              <option value="CREATE">{t('settings.audit.actions.create')}</option>
              <option value="UPDATE">{t('settings.audit.actions.update')}</option>
              <option value="DELETE">{t('settings.audit.actions.delete')}</option>
            </select>
          </div>

          {/* Entity Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('settings.audit.filterEntity')}</label>
            <select
              value={filters.entity}
              onChange={(e) => handleFilterChange('entity', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white text-sm"
            >
              <option value="ALL">{t('settings.audit.entities.all')}</option>
              <option value="product">{t('settings.audit.entities.product')}</option>
              <option value="invoice">{t('settings.audit.entities.invoice')}</option>
              <option value="client">{t('settings.audit.entities.client')}</option>
              <option value="supplier">{t('settings.audit.entities.supplier')}</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('settings.audit.filterFrom')}</label>
            <input
              type="date"
              value={filters.dateRange.start || ''}
              onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('settings.audit.filterTo')}</label>
            <input
              type="date"
              value={filters.dateRange.end || ''}
              onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-800">Audit Log</h3>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Download size={16} />
            {t('settings.audit.exportCSV')}
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Shield className="text-slate-300 animate-pulse" size={32} />
            </div>
            <p className="text-sm text-slate-500">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Shield className="text-slate-300" size={32} />
            </div>
            <p className="text-sm font-medium text-slate-900 mb-1">{t('settings.audit.emptyTitle')}</p>
            <p className="text-sm text-slate-500">{t('settings.audit.emptySubtext')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-left">Timestamp</th>
                  <th className="px-6 py-4 font-semibold text-left">Action</th>
                  <th className="px-6 py-4 font-semibold text-left">Entity</th>
                  <th className="px-6 py-4 font-semibold text-left">ID</th>
                  <th className="px-6 py-4 font-semibold text-left">User</th>
                  <th className="px-6 py-4 font-semibold text-left"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => handleViewDetail(log)}
                  >
                    <td className="px-6 py-4 text-sm text-slate-600" title={log.timestamp}>
                      {formatDate(log.timestamp, lang)}
                    </td>
                    <td className="px-6 py-4">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 capitalize flex items-center gap-2">
                      <EntityIcon entity={log.entity} />
                      {log.entity}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600 text-right">
                      {log.entityId}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{log.userId}</td>
                    <td className="px-6 py-4">
                      <button className="p-1 text-slate-400 hover:text-accent-600 transition-colors">
                        <ChevronRight size={16} className={isRTL ? 'rotate-180' : ''} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-sm text-slate-500">
        {t('settings.audit.showing', { count: logs.length })}
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedLog && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/30 z-50"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: isRTL ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={`fixed inset-y-0 ${isRTL ? 'left-0' : 'right-0'} w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">{t('settings.audit.detail.title')}</h3>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                    <ActionBadge action={selectedLog.action} />
                    <div>
                      <p className="text-sm font-medium text-slate-600 capitalize">{selectedLog.entity}</p>
                      <p className="text-xs text-slate-500">ID: {selectedLog.entityId}</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500">{formatDate(selectedLog.timestamp, lang)}</p>

                  {/* Payload */}
                  {selectedLog.action === 'UPDATE' ? (
                    <>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800 mb-2">{t('settings.audit.detail.before')}</h4>
                        <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto text-xs font-mono">
                          {JSON.stringify(selectedLog.payload, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800 mb-2">{t('settings.audit.detail.after')}</h4>
                        <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto text-xs font-mono">
                          {JSON.stringify(selectedLog.newPayload, null, 2)}
                        </pre>
                      </div>
                    </>
                  ) : (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 mb-2">Record</h4>
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto text-xs font-mono">
                        {JSON.stringify(selectedLog.payload, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Metadata */}
                  {selectedLog.metadata && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 mb-2">{t('settings.audit.detail.metadata')}</h4>
                      <pre className="bg-slate-100 p-4 rounded-xl overflow-x-auto text-xs font-mono text-slate-700">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuditPanel;
