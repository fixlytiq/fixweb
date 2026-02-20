import { Injectable } from '@nestjs/common';
import type { PaymentInterface, TransactionStatusResult, PaymentRequestOptions } from '../interfaces/payment.interface';

/**
 * Stub adapter for development and provider-agnostic flow testing.
 * Always returns SUCCEEDED with a fake provider id. No real API calls.
 */
@Injectable()
export class StubAdapter implements PaymentInterface {
  readonly providerName = 'stub';

  async authorize(
    _amountCents: number,
    _currency: string,
    _options?: PaymentRequestOptions,
  ): Promise<TransactionStatusResult> {
    return {
      status: 'AUTHORIZED',
      providerTransactionId: `stub_auth_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    };
  }

  async capture(
    _amountCents: number,
    _currency: string,
    options?: PaymentRequestOptions,
  ): Promise<TransactionStatusResult> {
    const id = options?.idempotencyKey
      ? `stub_${options.idempotencyKey.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32)}`
      : `stub_cap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    return {
      status: 'SUCCEEDED',
      providerTransactionId: id,
    };
  }

  async refund(
    providerTransactionId: string,
    _amountCents?: number,
    _options?: PaymentRequestOptions,
  ): Promise<TransactionStatusResult> {
    return {
      status: 'SUCCEEDED',
      providerTransactionId: `${providerTransactionId}_refund`,
    };
  }

  async void(providerTransactionId: string): Promise<TransactionStatusResult> {
    return {
      status: 'SUCCEEDED',
      providerTransactionId: `${providerTransactionId}_voided`,
    };
  }

  async retrieve(providerTransactionId: string): Promise<TransactionStatusResult> {
    // Stub: assume any known id is succeeded
    if (providerTransactionId.startsWith('stub_')) {
      return {
        status: 'SUCCEEDED',
        providerTransactionId,
      };
    }
    return { status: 'UNKNOWN', message: 'Transaction not found in stub' };
  }
}
