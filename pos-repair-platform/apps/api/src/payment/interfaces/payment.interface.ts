import type { PaymentErrorCode } from '../constants';

export type TransactionStatusResult =
  | { status: 'PENDING' }
  | { status: 'AUTHORIZED'; providerTransactionId: string }
  | { status: 'FAILED'; internalErrorCode: PaymentErrorCode; message?: string }
  | { status: 'SUCCEEDED'; providerTransactionId: string }
  | { status: 'UNKNOWN'; message?: string };

export interface PaymentRequestOptions {
  token?: string;
  idempotencyKey?: string;
  metadata?: Record<string, string>;
}

export interface PaymentInterface {
  readonly providerName: string;
  authorize(
    amountCents: number,
    currency: string,
    options?: PaymentRequestOptions,
  ): Promise<TransactionStatusResult>;
  capture(
    amountCents: number,
    currency: string,
    options?: PaymentRequestOptions,
  ): Promise<TransactionStatusResult>;
  refund(
    providerTransactionId: string,
    amountCents?: number,
    options?: PaymentRequestOptions,
  ): Promise<TransactionStatusResult>;
  void(providerTransactionId: string): Promise<TransactionStatusResult>;
  retrieve(providerTransactionId: string): Promise<TransactionStatusResult>;
}
