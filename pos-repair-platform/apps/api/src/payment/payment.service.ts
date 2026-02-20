import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, TransactionStatus } from '@prisma/client';
import type { PaymentInterface, TransactionStatusResult } from './interfaces/payment.interface';

const STALE_MINUTES = 10;

export interface ConfirmPaymentParams {
  saleId: string;
  storeId: string;
  amountCents: number;
  idempotencyKey: string;
  currency?: string;
  token?: string;
}

export interface ConfirmPaymentResult {
  status: TransactionStatus;
  saleId: string;
  providerTransactionId?: string;
  internalErrorCode?: string;
  /** When idempotency hit, this is the existing transaction. */
  idempotent?: boolean;
}

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('PaymentInterface') private readonly adapter: PaymentInterface,
  ) {}

  /**
   * Idempotent payment confirmation. If the same idempotencyKey was already processed,
   * returns the result of the first request (no double charge).
   */
  async confirmPayment(params: ConfirmPaymentParams): Promise<ConfirmPaymentResult> {
    const { saleId, storeId, amountCents, idempotencyKey, currency = 'USD', token } = params;

    const existing = await this.prisma.paymentTransaction.findUnique({
      where: { idempotencyKey },
      include: { Sale: true },
    });

    if (existing) {
      if (existing.saleId !== saleId) {
        throw new BadRequestException(
          'Idempotency key already used for a different sale',
        );
      }
      return {
        status: existing.status as TransactionStatus,
        saleId: existing.saleId,
        providerTransactionId: existing.providerTransactionId ?? undefined,
        internalErrorCode: existing.internalErrorCode ?? undefined,
        idempotent: true,
      };
    }

    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, storeId },
      include: { SaleLineItem: true },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }
    if (sale.paymentStatus !== 'PENDING') {
      throw new BadRequestException(
        `Sale is already ${sale.paymentStatus}; cannot confirm payment`,
      );
    }

    const txId = crypto.randomUUID();
    const requestPayload = this.maskForLog({ amountCents, currency, idempotencyKey }) as Prisma.InputJsonValue;

    await this.prisma.paymentTransaction.create({
      data: {
        id: txId,
        idempotencyKey,
        saleId,
        storeId,
        status: TransactionStatus.PENDING,
        provider: this.adapter.providerName,
        amount: amountCents / 100,
        currency,
        requestPayload,
      },
    });

    let result: TransactionStatusResult;
    try {
      result = await this.adapter.capture(amountCents, currency, {
        idempotencyKey,
        token,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await this.prisma.paymentTransaction.update({
        where: { id: txId },
        data: {
          status: TransactionStatus.UNKNOWN,
          responsePayload: this.maskForLog({ error: message }) as Prisma.InputJsonValue,
          internalErrorCode: 'PROVIDER_ERROR',
          updatedAt: new Date(),
        },
      });
      return {
        status: TransactionStatus.UNKNOWN,
        saleId,
        internalErrorCode: 'PROVIDER_ERROR',
      };
    }

    const responsePayload = this.maskForLog(result) as Prisma.InputJsonValue;
    const status = this.mapResultToStatus(result);
    const providerTransactionId =
      'providerTransactionId' in result ? result.providerTransactionId : undefined;
    const internalErrorCode =
      result.status === 'FAILED' ? result.internalErrorCode : undefined;

    await this.prisma.paymentTransaction.update({
      where: { id: txId },
      data: {
        status,
        providerTransactionId,
        responsePayload,
        internalErrorCode,
        updatedAt: new Date(),
      },
    });

    if (status === TransactionStatus.SUCCEEDED) {
      await this.prisma.sale.update({
        where: { id: saleId },
        data: {
          paymentStatus: 'PAID',
          paidAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return {
      status,
      saleId,
      providerTransactionId,
      internalErrorCode,
    };
  }

  /**
   * Reconciliation: find transactions stuck in PENDING/UNKNOWN > 10 min and sync with provider.
   * Also run hourly via cron.
   */
  @Cron('0 * * * *') // Every hour at minute 0
  async runReconciliationCron(): Promise<void> {
    const result = await this.runReconciliation();
    if (result.updated > 0 || result.failed > 0) {
      console.log(
        `[Payment] Reconciliation: updated=${result.updated} failed=${result.failed}`,
      );
    }
  }

  async runReconciliation(): Promise<{ updated: number; failed: number }> {
    const cutoff = new Date(Date.now() - STALE_MINUTES * 60 * 1000);
    const stuck = await this.prisma.paymentTransaction.findMany({
      where: {
        status: { in: [TransactionStatus.PENDING, TransactionStatus.UNKNOWN] },
        createdAt: { lt: cutoff },
        providerTransactionId: { not: null },
      },
    });

    let updated = 0;
    let failed = 0;

    for (const tx of stuck) {
      if (!tx.providerTransactionId) continue;
      try {
        const result = await this.adapter.retrieve(tx.providerTransactionId);
        const status = this.mapResultToStatus(result);
        const providerTransactionId =
          'providerTransactionId' in result ? result.providerTransactionId : tx.providerTransactionId;
        await this.prisma.paymentTransaction.update({
          where: { id: tx.id },
          data: {
            status,
            providerTransactionId,
            responsePayload: this.maskForLog(result) as Prisma.InputJsonValue,
            updatedAt: new Date(),
          },
        });
        if (status === TransactionStatus.SUCCEEDED) {
          await this.prisma.sale.update({
            where: { id: tx.saleId },
            data: {
              paymentStatus: 'PAID',
              paidAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
        updated++;
      } catch {
        failed++;
      }
    }

    return { updated, failed };
  }

  private mapResultToStatus(result: TransactionStatusResult): TransactionStatus {
    switch (result.status) {
      case 'PENDING':
        return TransactionStatus.PENDING;
      case 'AUTHORIZED':
        return TransactionStatus.AUTHORIZED;
      case 'FAILED':
        return TransactionStatus.FAILED;
      case 'SUCCEEDED':
        return TransactionStatus.SUCCEEDED;
      case 'UNKNOWN':
        return TransactionStatus.UNKNOWN;
      default:
        return TransactionStatus.UNKNOWN;
    }
  }

  /** Mask PII/card data before persisting for dispute logs. */
  private maskForLog(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        const key = k.toLowerCase();
        if (key.includes('card') || key.includes('cvc') || key === 'token') {
          out[k] = '[REDACTED]';
        } else {
          out[k] = this.maskForLog(v);
        }
      }
      return out;
    }
    return obj;
  }
}
