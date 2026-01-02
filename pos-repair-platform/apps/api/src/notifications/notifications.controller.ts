import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationHistoryService } from './notification-history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { UserPayload } from '../auth/types';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationHistoryService: NotificationHistoryService,
  ) {}

  @Get('unread-count')
  async getUnreadCount(@GetUser() user: UserPayload) {
    return this.notificationHistoryService.getUnreadCount(user);
  }

  @Get()
  async findAll(
    @GetUser() user: UserPayload,
    @Query('read') read?: string,
    @Query('limit') limit?: string,
  ) {
    const readFilter = read === 'true' ? true : read === 'false' ? false : undefined;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.notificationHistoryService.findAll(user, readFilter, limitNum);
  }

  @Patch(':id/read')
  async markAsRead(
    @GetUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    return this.notificationHistoryService.markAsRead(user, id);
  }

  @Patch('read-all')
  async markAllAsRead(@GetUser() user: UserPayload) {
    return this.notificationHistoryService.markAllAsRead(user);
  }
}

