/**
 * Error Utilities - Integration 1
 * Map IPC error codes to translated messages
 */

/**
 * Map IPC error codes to translated messages
 * Falls back to the error's raw message, then to a generic unknown error
 */
export const getErrorMessage = (
  error: { code: string; message: string } | undefined,
  t: (key: string) => string
): string => {
  if (!error) return t('errors.UNKNOWN');
  const translatedKey = `errors.${error.code}`;
  const translated = t(translatedKey);
  // If t() returned the key itself (missing translation), use the raw message
  return translated === translatedKey ? error.message : translated;
};
