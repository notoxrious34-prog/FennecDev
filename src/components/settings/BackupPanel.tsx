import React, { useState, useEffect } from 'react';
import { useBackupStatus } from '../../hooks/useBackupStatus';
import { useTranslation } from '../../i18n/useTranslation';
import { getRelativeTime, formatBytes, formatDate } from '../../utils/dateUtils';
import { Database, HardDrive, Clock, AlertCircle, CheckCircle, RefreshCw, Trash2, Download } from 'lucide-react';

const BackupPanel = () => {
  const { t, lang, isRTL } = useTranslation();
  const { backupInfo, backupStats, isLoading, error, refetch, createBackup, deleteBackup } = useBackupStatus();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [highlightedBackup, setHighlightedBackup] = useState<string | null>(null);

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    const success = await createBackup();
    if (success) {
      setHighlightedBackup(backupInfo?.backupFiles[0]?.filename || null);
      setTimeout(() => setHighlightedBackup(null), 2000);
    }
    setIsBackingUp(false);
  };

  const handleDeleteBackup = async (filename: string) => {
    if (window.confirm(t('confirmDelete'))) {
      await deleteBackup(filename);
    }
  };

  const getBackupStatus = () => {
    if (!backupInfo?.lastBackupAt) return 'critical';
    const hoursSinceBackup = (Date.now() - new Date(backupInfo.lastBackupAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceBackup < 24) return 'good';
    if (hoursSinceBackup < 48) return 'warning';
    return 'critical';
  };

  const statusConfig = {
    good: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle, label: t('settings.backup.statusGood') },
    warning: { color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertCircle, label: t('settings.backup.statusWarning') },
    critical: { color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertCircle, label: t('settings.backup.statusCritical') },
  };

  const status = getBackupStatus();
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const parseBackupDate = (filename: string) => {
    const match = filename.match(/backup_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})/);
    if (match) {
      const [_, date, time] = match;
      return new Date(`${date} ${time.replace(/-/g, ':')}`);
    }
    return new Date();
  };

  if (isLoading && !backupInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Database className="text-slate-500" size={24} />
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t('settings.backup.title')}</h2>
          <p className="text-sm text-slate-500">{t('settings.backup.subtitle')}</p>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Last Backup */}
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${config.bg}`}>
              <StatusIcon className={config.color} size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">{t('settings.backup.lastBackup')}</p>
              {backupInfo?.lastBackupAt ? (
                <>
                  <p className="text-lg font-semibold text-slate-900">{formatDate(backupInfo.lastBackupAt, lang)}</p>
                  <p className="text-sm text-slate-500">{getRelativeTime(backupInfo.lastBackupAt, lang)}</p>
                </>
              ) : (
                <p className="text-lg font-semibold text-slate-900">{t('settings.backup.noBackups')}</p>
              )}
            </div>
          </div>

          {/* Total Backups */}
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-slate-50">
              <HardDrive className="text-slate-600" size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">{t('settings.backup.totalStored')}</p>
              <p className="text-lg font-semibold text-slate-900">
                {backupStats?.count || 0} / {backupStats?.maxBackups || 7}
              </p>
              <p className="text-sm text-slate-500">{t('settings.backup.retentionNote')}</p>
            </div>
          </div>

          {/* Backup Size */}
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-slate-50">
              <Clock className="text-slate-600" size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Total Size</p>
              <p className="text-lg font-semibold text-slate-900">
                {backupStats?.totalSizeFormatted || formatBytes(0)}
              </p>
              <p className="text-sm text-slate-500">
                {backupStats?.oldestBackup ? `Since: ${formatDate(backupStats.oldestBackup, lang)}` : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Backup Files List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-800">Backup Files</h3>
        </div>
        
        {backupInfo?.backupFiles && backupInfo.backupFiles.length > 0 ? (
          <div className="max-h-64 overflow-y-auto">
            {backupInfo.backupFiles.map((backup, index) => {
              const isLatest = index === 0;
              const backupDate = parseBackupDate(backup.filename);
              const isHighlighted = highlightedBackup === backup.filename;
              
              return (
                <div
                  key={backup.filename}
                  className={`flex items-center justify-between p-4 border-b border-slate-50 last:border-b-0 transition-all ${
                    isHighlighted ? 'bg-amber-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {isLatest && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-accent-100 text-accent-700 rounded-md">
                        {t('settings.backup.latestBadge')}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{backup.filename}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(backupDate, lang)} • {backup.sizeFormatted}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteBackup(backup.filename)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title={t('delete')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Database className="text-slate-300" size={32} />
            </div>
            <p className="text-sm text-slate-500">{t('settings.backup.noBackups')}</p>
          </div>
        )}
      </div>

      {/* Backup Now Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBackupNow}
          disabled={isBackingUp}
          className="flex items-center gap-2 px-6 py-3 bg-accent-600 hover:bg-accent-700 text-white rounded-xl font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBackingUp ? (
            <>
              <RefreshCw className="animate-spin" size={18} />
              {t('settings.backup.inProgress')}
            </>
          ) : (
            <>
              <Download size={18} />
              {t('settings.backup.backupNow')}
            </>
          )}
        </button>
        
        {backupInfo?.lastBackupAt && (
          <p className="text-sm text-slate-500">
            {getRelativeTime(backupInfo.lastBackupAt, lang)}
          </p>
        )}
      </div>
    </div>
  );
};

export default BackupPanel;
