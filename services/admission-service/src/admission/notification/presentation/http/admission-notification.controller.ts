import {
  AdmissionNotificationListResponseDto,
  AdmissionNotificationResponseDto,
  AdmissionNotificationsReadResponseDto,
} from './dto/response/admission-notification-response.dto.js'
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
import { RequirePermissions } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
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
  @RequirePermissions('admissions.apply')
  @ApiOperation({ summary: 'My notifications (latest 50, with unread count)' })
  async getNotifications(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AdmissionNotificationListResponseDto> {
    return AdmissionNotificationListResponseDto.fromDomain(
      await this.getMyNotificationsService.execute(user.id),
    )
  }

  @Patch('notifications/read-all')
  @RequirePermissions('admissions.apply')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  async markAllRead(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AdmissionNotificationsReadResponseDto> {
    return AdmissionNotificationsReadResponseDto.fromDomain(
      await this.markNotificationReadService.executeAll(user.id),
    )
  }

  @Patch('notifications/:id/read')
  @RequirePermissions('admissions.apply')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdmissionNotificationResponseDto> {
    return AdmissionNotificationResponseDto.fromDomain(
      await this.markNotificationReadService.executeOne(user.id, id),
    )
  }
}
