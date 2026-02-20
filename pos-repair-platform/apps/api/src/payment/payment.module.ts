import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentService } from './payment.service';
import { StubAdapter } from './adapters/stub.adapter';
import type { PaymentInterface } from './interfaces/payment.interface';

@Module({
  imports: [PrismaModule],
  providers: [
    StubAdapter,
    {
      provide: 'PaymentAdapter',
      useExisting: StubAdapter,
    },
    {
      provide: 'PaymentInterface',
      useFactory: (adapter: StubAdapter): PaymentInterface => adapter,
      inject: [StubAdapter],
    },
    PaymentService,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
