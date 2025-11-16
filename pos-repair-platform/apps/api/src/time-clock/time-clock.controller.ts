import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TimeClockService } from './time-clock.service';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { UserPayload } from '../auth/types';

@Controller('time-clock')
@UseGuards(JwtAuthGuard)
export class TimeClockController {
  constructor(private readonly timeClockService: TimeClockService) {}

  @Post('clock-in')
  clockIn(@GetUser() user: UserPayload, @Body() clockInDto: ClockInDto) {
    return this.timeClockService.clockIn(user, clockInDto);
  }

  @Post('clock-out')
  clockOut(@GetUser() user: UserPayload, @Body() clockOutDto: ClockOutDto) {
    return this.timeClockService.clockOut(user, clockOutDto);
  }

  @Get('my-clocks')
  getMyTimeClocks(@GetUser() user: UserPayload) {
    return this.timeClockService.getMyTimeClocks(user);
  }

  @Get('active')
  getActiveClock(@GetUser() user: UserPayload) {
    return this.timeClockService.getActiveClock(user);
  }
}

