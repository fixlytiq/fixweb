/**
 * Internal error codes for payment failures.
 * Provider-specific codes are mapped to these by each adapter.
 */
export const PAYMENT_ERROR_CODES = {
  DECLINED: 'DECLINED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_CARD: 'EXPIRED_CARD',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;

export type PaymentErrorCode =
  (typeof PAYMENT_ERROR_CODES)[keyof typeof PAYMENT_ERROR_CODES];
