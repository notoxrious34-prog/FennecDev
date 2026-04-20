import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Zap } from 'lucide-react';
import { useLicense } from '../../store/LicenseContext';
import { useI18n } from '../../i18n/i18nContext';
import styles from './TrialBanner.module.css';

/**
 * Persistent banner shown when:
 * - License type is 'trial'
 * - License is expiring within 30 days (full license)
 * - License has expired (should not normally be seen — boot guard prevents launch)
 *
 * Renders null when license is full and not expiring soon.
 */
export const TrialBanner: React.FC = () => {
  const {
    isTrial,
    daysLeft,
    isExpired,
    isExpiringSoon,
    isExpiringSoonCritical,
    licenseType,
  } = useLicense();
  const { t } = useI18n();
  const navigate = useNavigate();

  // Do not render for healthy full licenses
  if (!isTrial && !isExpiringSoon && !isExpired) return null;
  // Do not render if we don't know the license type yet
  if (!licenseType) return null;

  // Determine severity
  const isError = isExpired || isExpiringSoonCritical;
  const isWarning = !isError && ((isTrial && daysLeft <= 30) || isExpiringSoon);

  const bannerClass = [
    styles.banner,
    isError ? styles['banner--error'] : '',
    isWarning ? styles['banner--warning'] : '',
    !isError && !isWarning ? styles['banner--info'] : '',
  ]
    .filter(Boolean)
    .join(' ');

  const Icon = isExpired
    ? AlertTriangle
    : isExpiringSoonCritical
      ? AlertTriangle
      : Clock;

  const message = isExpired
    ? t('license.banner.expired')
    : isTrial && daysLeft === 0
      ? t('license.banner.trialExpiredToday')
      : isTrial
        ? t('license.banner.trialDaysLeft', { count: daysLeft })
        : t('license.banner.fullExpiringSoon', { count: daysLeft });

  return (
    <div
      className={bannerClass}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={styles.banner__content}>
        <Icon size={14} className={styles.banner__icon} aria-hidden="true" />
        <span className={styles.banner__message}>{message}</span>
      </div>

      <button
        className={styles.banner__action}
        onClick={() => navigate('/settings#license')}
        aria-label={t('aria.goToLicenseSettings')}
      >
        <Zap size={12} aria-hidden="true" />
        {isExpired || isExpiringSoonCritical
          ? t('license.banner.renewNow')
          : t('license.banner.upgradeNow')}
      </button>
    </div>
  );
};
