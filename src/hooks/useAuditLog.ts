import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';

interface AuditLog {
  id: number;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entityId: string;
  userId: string;
  payload: any;
  newPayload: any;
  metadata: any;
}

interface AuditFilters {
  dateRange: { start: string | null; end: string | null };
  action: 'ALL' | 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'ALL' | 'product' | 'invoice' | 'client' | 'supplier';
  limit: number;
}

export const useAuditLog = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditFilters>({
    dateRange: { start: null, end: null },
    action: 'ALL',
    entity: 'ALL',
    limit: 100,
  });

  const debouncedFilters = useDebounce(filters, 300);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let result;
      if (debouncedFilters.dateRange.start && debouncedFilters.dateRange.end) {
        result = await window.api.audit.getByDateRange(
          debouncedFilters.dateRange.start,
          debouncedFilters.dateRange.end
        );
      } else {
        result = await window.api.audit.getRecent(debouncedFilters.limit);
      }

      if (result.success && result.data) {
        let data = result.data;
        // Client-side filtering for action and entity
        if (debouncedFilters.action !== 'ALL') {
          data = data.filter((l: AuditLog) => l.action === debouncedFilters.action);
        }
        if (debouncedFilters.entity !== 'ALL') {
          data = data.filter((l: AuditLog) => l.entity === debouncedFilters.entity);
        }
        setLogs(data);
      } else {
        setError('Failed to fetch audit logs');
        setLogs([]);
      }
    } catch (err) {
      setError('Failed to fetch audit logs');
      console.error('useAuditLog error:', err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedFilters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    isLoading,
    error,
    filters,
    setFilters,
    refetch: fetchLogs
  };
};
