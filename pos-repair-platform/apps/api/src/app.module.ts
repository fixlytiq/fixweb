import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { EmployeesModule } from './employees/employees.module';
import { TimeClockModule } from './time-clock/time-clock.module';
import { RefundsModule } from './refunds/refunds.module';
import { InventoryModule } from './inventory/inventory.module';
import { TicketsModule } from './tickets/tickets.module';
import { SalesModule } from './sales/sales.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    StoresModule,
    EmployeesModule,
    TimeClockModule,
    RefundsModule,
    InventoryModule,
    TicketsModule,
    SalesModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
