export type ConsentState = 'unset' | 'granted' | 'denied';

export const CONSENT_STORAGE_KEY = 'tt-analytics-consent';

export const GA4_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{6,12}$/;

export function isValidMeasurementId(value: string | undefined | null): boolean {
  return typeof value === 'string' && GA4_MEASUREMENT_ID_PATTERN.test(value);
}
