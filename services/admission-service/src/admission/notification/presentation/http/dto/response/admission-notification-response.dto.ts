import type { MarkNotificationReadUseCase } from '../../../../application/use-cases/mark-notification-read/mark-notification-read.use-case.js'
import type { AdmissionNotificationList } from '../../../../domain/repositories/admission-notification-repository.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { AdmissionNotificationEntity } from '../../../../domain/entities/admission-notification.entity.js'

export class AdmissionNotificationResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({
    enum: ['STATUS_CHANGE', 'DOCUMENT', 'PAYMENT', 'ANNOUNCEMENT', 'GENERAL'],
  })
  type!: 'STATUS_CHANGE' | 'DOCUMENT' | 'PAYMENT' | 'ANNOUNCEMENT' | 'GENERAL'

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String })
  message!: string

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  readAt!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: AdmissionNotificationEntity,
  ): AdmissionNotificationResponseDto {
    const dto = new AdmissionNotificationResponseDto()
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.type = domain.type
    dto.title = domain.title
    dto.message = domain.message
    dto.readAt =
      domain.readAt == null ? domain.readAt : domain.readAt.toISOString()
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class AdmissionNotificationsReadResponseDto {
  @ApiProperty({ type: Boolean })
  success!: boolean

  static fromDomain(
    domain: Awaited<ReturnType<MarkNotificationReadUseCase['executeAll']>>,
  ): AdmissionNotificationsReadResponseDto {
    const dto = new AdmissionNotificationsReadResponseDto()
    dto.success = domain.success
    return dto
  }
}

export class AdmissionNotificationListMetaResponseDto {
  @ApiProperty({ type: Number })
  unreadCount!: number
}

export class AdmissionNotificationListResponseDto {
  @ApiProperty({ type: () => [AdmissionNotificationResponseDto] })
  data!: AdmissionNotificationResponseDto[]

  @ApiProperty({ type: () => AdmissionNotificationListMetaResponseDto })
  meta!: AdmissionNotificationListMetaResponseDto

  static fromDomain(
    domain: AdmissionNotificationList,
  ): AdmissionNotificationListResponseDto {
    const dto = new AdmissionNotificationListResponseDto()
    dto.data = domain.data.map((item) =>
      AdmissionNotificationResponseDto.fromDomain(item),
    )
    dto.meta = { unreadCount: domain.unreadCount }
    return dto
  }
}
