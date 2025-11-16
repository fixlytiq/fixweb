import { Module } from '@nestjs/common';
import { TimeClockService } from './time-clock.service';
import { TimeClockController } from './time-clock.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TimeClockController],
  providers: [TimeClockService],
  exports: [TimeClockService],
})
export class TimeClockModule {}

