import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../../core/decorators/current-user.decorator.js'
import type { AuthenticatedUser } from '../../../../core/types/authenticated-user.type.js'
import { JwtAuthGuard } from '../../../../platform/auth/index.js'
import { GetMyNotificationsUseCase } from '../../application/use-cases/get-my-notifications/get-my-notifications.use-case.js'
import { MarkNotificationReadUseCase } from '../../application/use-cases/mark-notification-read/mark-notification-read.use-case.js'

@ApiTags('Admission — Applicant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admissions')
export class AdmissionNotificationController {
  constructor(
    private readonly getMyNotificationsService: GetMyNotificationsUseCase,
    private readonly markNotificationReadService: MarkNotificationReadUseCase,
  ) {}

  @Get('my-application/notifications')
  @ApiOperation({ summary: 'My notifications (latest 50, with unread count)' })
  async getNotifications(@CurrentUser() user: AuthenticatedUser) {
    return this.getMyNotificationsService.execute(user.id)
  }

  @Patch('notifications/read-all')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  async markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.markNotificationReadService.executeAll(user.id)
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.markNotificationReadService.executeOne(user.id, id)
  }
}
