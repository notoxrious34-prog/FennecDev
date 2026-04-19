import { useState, useEffect, useCallback } from 'react';

interface BackupInfo {
  lastBackupAt: string | null;
  totalBackups: number;
  backupFiles: Array<{
    filename: string;
    path: string;
    size: number;
    createdAt: Date;
    sizeFormatted: string;
  }>;
}

interface BackupStats {
  count: number;
  totalSize: number;
  totalSizeFormatted: string;
  oldestBackup: Date | null;
  newestBackup: Date | null;
  maxBackups: number;
}

export const useBackupStatus = () => {
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const [backupStats, setBackupStats] = useState<BackupStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBackupInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [infoRes, statsRes] = await Promise.all([
        window.api.backup.getAll(),
        window.api.backup.getStats()
      ]);

      if (infoRes.success && infoRes.data) {
        setBackupInfo(infoRes.data);
      } else {
        setError('Failed to fetch backup info');
      }

      if (statsRes.success && statsRes.data) {
        setBackupStats(statsRes.data);
      }
    } catch (err) {
      setError('Failed to fetch backup info');
      console.error('useBackupStatus error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBackup = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await window.api.backup.create();
      if (result.success) {
        await fetchBackupInfo(); // Refresh after creating
        return true;
      } else {
        setError(result.error || 'Backup failed');
        return false;
      }
    } catch (err) {
      setError('Backup failed');
      console.error('createBackup error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchBackupInfo]);

  const deleteBackup = useCallback(async (filename: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await window.api.backup.delete(filename);
      if (result.success) {
        await fetchBackupInfo(); // Refresh after deleting
        return true;
      } else {
        setError(result.error || 'Delete failed');
        return false;
      }
    } catch (err) {
      setError('Delete failed');
      console.error('deleteBackup error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchBackupInfo]);

  useEffect(() => {
    fetchBackupInfo();
  }, [fetchBackupInfo]);

  return {
    backupInfo,
    backupStats,
    isLoading,
    error,
    refetch: fetchBackupInfo,
    createBackup,
    deleteBackup
  };
};
