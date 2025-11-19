import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { UserPayload } from '../auth/types';

@Injectable()
export class TimeClockService {
  constructor(private readonly prisma: PrismaService) {}

  async clockIn(user: UserPayload, clockInDto: ClockInDto) {
    // Check if employee already has an active clock-in
    const activeClock = await this.prisma.timeClock.findFirst({
      where: {
        employeeId: user.employeeId,
        storeId: user.storeId,
        clockOutAt: null,
      },
      orderBy: { clockInAt: 'desc' },
    });

    if (activeClock) {
      throw new BadRequestException('You already have an active clock-in. Please clock out first.');
    }

    return this.prisma.timeClock.create({
      data: {
        id: crypto.randomUUID(),
        storeId: user.storeId,
        employeeId: user.employeeId,
        clockInAt: new Date(),
        notes: clockInDto.notes,
        updatedAt: new Date(),
      },
    });
  }

  async clockOut(user: UserPayload, clockOutDto: ClockOutDto) {
    // Find active clock-in
    const activeClock = await this.prisma.timeClock.findFirst({
      where: {
        employeeId: user.employeeId,
        storeId: user.storeId,
        clockOutAt: null,
      },
      orderBy: { clockInAt: 'desc' },
    });

    if (!activeClock) {
      throw new BadRequestException('No active clock-in found. Please clock in first.');
    }

    // Calculate total hours
    const clockOutAt = new Date();
    const totalMs = clockOutAt.getTime() - activeClock.clockInAt.getTime();
    const totalHours = totalMs / (1000 * 60 * 60); // Convert to hours

    return this.prisma.timeClock.update({
      where: { id: activeClock.id },
      data: {
        clockOutAt,
        totalHours: totalHours.toFixed(2),
        notes: clockOutDto.notes || activeClock.notes,
        updatedAt: new Date(),
      },
    });
  }

  async getMyTimeClocks(user: UserPayload) {
    return this.prisma.timeClock.findMany({
      where: {
        employeeId: user.employeeId,
        storeId: user.storeId,
      },
      include: {
        Store: true,
      },
      orderBy: { clockInAt: 'desc' },
    });
  }

  async getActiveClock(user: UserPayload) {
    return this.prisma.timeClock.findFirst({
      where: {
        employeeId: user.employeeId,
        storeId: user.storeId,
        clockOutAt: null,
      },
      include: {
        Store: true,
      },
      orderBy: { clockInAt: 'desc' },
    });
  }
}
