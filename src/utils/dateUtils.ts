/**
 * Date utility functions for locale-aware formatting
 */

export const getRelativeTime = (isoString: string, locale: string = 'en'): string => {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diffMs = new Date(isoString).getTime() - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffSeconds) < 60) return rtf.format(diffSeconds, 'second');
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute');
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  return rtf.format(diffDays, 'day');
};

export const formatDate = (dateInput: string | Date, locale: string = 'en', options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(new Date(dateInput));
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
