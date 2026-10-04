import type { ProcessApprovalResult } from '../../../../domain/repositories/approval.repository.js'
import type { GetPendingApprovalsUseCase } from '../../../../application/use-cases/get-pending-approvals/get-pending-approvals.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { ApprovalWorkflowRepositoryOutput } from '../../../../domain/repositories/approval.repository.js'

export class ApprovalWorkflowResponseStepsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  workflowId!: string

  @ApiProperty({ type: Number })
  stepSequence!: number

  @ApiProperty({ type: String })
  approverRoleCode!: string

  @ApiProperty({ type: Boolean })
  isMandatory!: boolean

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<ApprovalWorkflowRepositoryOutput['steps']>[number]
    >,
  ): ApprovalWorkflowResponseStepsDto {
    const dto = new ApprovalWorkflowResponseStepsDto()
    dto.id = domain.id
    dto.workflowId = domain.workflowId
    dto.stepSequence = domain.stepSequence
    dto.approverRoleCode = domain.approverRoleCode
    dto.isMandatory = domain.isMandatory
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class ApprovalWorkflowResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  targetEntity!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  @ApiPropertyOptional({
    type: () => ApprovalWorkflowResponseStepsDto,
    isArray: true,
  })
  steps?: ApprovalWorkflowResponseStepsDto[]

  static fromDomain(
    domain: ApprovalWorkflowRepositoryOutput,
  ): ApprovalWorkflowResponseDto {
    const dto = new ApprovalWorkflowResponseDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.targetEntity = domain.targetEntity
    dto.description = domain.description
    dto.isActive = domain.isActive
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    if (domain.steps !== undefined)
      dto.steps =
        domain.steps == null
          ? domain.steps
          : domain.steps.map((x) =>
              ApprovalWorkflowResponseStepsDto.fromDomain(x),
            )
    return dto
  }
}

export class PendingApprovalResponseDetailsItemsUnitAssetDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            NonNullable<
              Awaited<
                ReturnType<GetPendingApprovalsUseCase['execute']>
              >[number]['details']
            >['items']
          >[number]
        >['unit']
      >['asset']
    >,
  ): PendingApprovalResponseDetailsItemsUnitAssetDto {
    const dto = new PendingApprovalResponseDetailsItemsUnitAssetDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class PendingApprovalResponseDetailsItemsUnitDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  unitNumber!: string

  @ApiPropertyOptional({
    type: () => PendingApprovalResponseDetailsItemsUnitAssetDto,
    nullable: true,
  })
  asset?: PendingApprovalResponseDetailsItemsUnitAssetDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            Awaited<
              ReturnType<GetPendingApprovalsUseCase['execute']>
            >[number]['details']
          >['items']
        >[number]
      >['unit']
    >,
  ): PendingApprovalResponseDetailsItemsUnitDto {
    const dto = new PendingApprovalResponseDetailsItemsUnitDto()
    dto.id = domain.id
    dto.unitNumber = domain.unitNumber
    if (domain.asset !== undefined)
      dto.asset =
        domain.asset == null
          ? domain.asset
          : PendingApprovalResponseDetailsItemsUnitAssetDto.fromDomain(
              domain.asset,
            )
    return dto
  }
}

export class PendingApprovalResponseDetailsItemsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  unitId!: string

  @ApiPropertyOptional({
    type: () => PendingApprovalResponseDetailsItemsUnitDto,
    nullable: true,
  })
  unit?: PendingApprovalResponseDetailsItemsUnitDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<
            ReturnType<GetPendingApprovalsUseCase['execute']>
          >[number]['details']
        >['items']
      >[number]
    >,
  ): PendingApprovalResponseDetailsItemsDto {
    const dto = new PendingApprovalResponseDetailsItemsDto()
    dto.id = domain.id
    dto.unitId = domain.unitId
    if (domain.unit !== undefined)
      dto.unit =
        domain.unit == null
          ? domain.unit
          : PendingApprovalResponseDetailsItemsUnitDto.fromDomain(domain.unit)
    return dto
  }
}

export class PendingApprovalResponseDetailsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  loanNumber!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  purpose?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  expectedReturnDate?: string | null

  @ApiProperty({
    type: () => PendingApprovalResponseDetailsItemsDto,
    isArray: true,
  })
  items!: PendingApprovalResponseDetailsItemsDto[]

  static fromDomain(
    domain: NonNullable<
      Awaited<
        ReturnType<GetPendingApprovalsUseCase['execute']>
      >[number]['details']
    >,
  ): PendingApprovalResponseDetailsDto {
    const dto = new PendingApprovalResponseDetailsDto()
    dto.id = domain.id
    dto.loanNumber = domain.loanNumber
    dto.purpose = domain.purpose
    if (domain.expectedReturnDate !== undefined)
      dto.expectedReturnDate =
        domain.expectedReturnDate == null
          ? domain.expectedReturnDate
          : domain.expectedReturnDate.toISOString()
    dto.items = domain.items.map((x) =>
      PendingApprovalResponseDetailsItemsDto.fromDomain(x),
    )
    return dto
  }
}

export class PendingApprovalResponseWorkflowStepsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  workflowId!: string

  @ApiProperty({ type: Number })
  stepSequence!: number

  @ApiProperty({ type: String })
  approverRoleCode!: string

  @ApiProperty({ type: Boolean })
  isMandatory!: boolean

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<
            ReturnType<GetPendingApprovalsUseCase['execute']>
          >[number]['workflow']
        >['steps']
      >[number]
    >,
  ): PendingApprovalResponseWorkflowStepsDto {
    const dto = new PendingApprovalResponseWorkflowStepsDto()
    dto.id = domain.id
    dto.workflowId = domain.workflowId
    dto.stepSequence = domain.stepSequence
    dto.approverRoleCode = domain.approverRoleCode
    dto.isMandatory = domain.isMandatory
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class PendingApprovalResponseWorkflowDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  targetEntity!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  @ApiPropertyOptional({
    type: () => PendingApprovalResponseWorkflowStepsDto,
    isArray: true,
  })
  steps?: PendingApprovalResponseWorkflowStepsDto[]

  static fromDomain(
    domain: NonNullable<
      Awaited<
        ReturnType<GetPendingApprovalsUseCase['execute']>
      >[number]['workflow']
    >,
  ): PendingApprovalResponseWorkflowDto {
    const dto = new PendingApprovalResponseWorkflowDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.targetEntity = domain.targetEntity
    dto.description = domain.description
    dto.isActive = domain.isActive
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    if (domain.steps !== undefined)
      dto.steps =
        domain.steps == null
          ? domain.steps
          : domain.steps.map((x) =>
              PendingApprovalResponseWorkflowStepsDto.fromDomain(x),
            )
    return dto
  }
}

export class PendingApprovalResponseLogsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  instanceId!: string

  @ApiProperty({ type: Number })
  stepSequence!: number

  @ApiProperty({ type: String })
  approverId!: string

  @ApiProperty({ type: String })
  actionId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ enum: ['NONE', 'FINAL_APPROVAL', 'REJECTION'] })
  consequenceType!: 'NONE' | 'FINAL_APPROVAL' | 'REJECTION'

  @ApiProperty({ enum: ['NOT_REQUIRED', 'PENDING', 'COMPLETED', 'FAILED'] })
  consequenceStatus!: 'NOT_REQUIRED' | 'PENDING' | 'COMPLETED' | 'FAILED'

  @ApiProperty({ type: String, nullable: true })
  consequenceError!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  consequenceUpdatedAt!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<
          ReturnType<GetPendingApprovalsUseCase['execute']>
        >[number]['logs']
      >[number]
    >,
  ): PendingApprovalResponseLogsDto {
    const dto = new PendingApprovalResponseLogsDto()
    dto.id = domain.id
    dto.instanceId = domain.instanceId
    dto.stepSequence = domain.stepSequence
    dto.approverId = domain.approverId
    dto.actionId = domain.actionId
    dto.note = domain.note
    dto.createdAt = domain.createdAt.toISOString()
    dto.consequenceType = domain.consequenceType
    dto.consequenceStatus = domain.consequenceStatus
    dto.consequenceError = domain.consequenceError
    dto.consequenceUpdatedAt = domain.consequenceUpdatedAt.toISOString()
    return dto
  }
}

export class PendingApprovalResponseDto {
  @ApiProperty({
    type: () => PendingApprovalResponseDetailsDto,
    nullable: true,
  })
  details!: PendingApprovalResponseDetailsDto | null

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  workflowId!: string

  @ApiProperty({ type: String })
  referenceId!: string

  @ApiProperty({ type: String })
  statusId!: string

  @ApiProperty({ type: Number })
  currentStepSequence!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  @ApiPropertyOptional({
    type: () => PendingApprovalResponseWorkflowDto,
    nullable: true,
  })
  workflow?: PendingApprovalResponseWorkflowDto | null

  @ApiPropertyOptional({
    type: () => PendingApprovalResponseLogsDto,
    isArray: true,
  })
  logs?: PendingApprovalResponseLogsDto[]

  static fromDomain(
    domain: Awaited<ReturnType<GetPendingApprovalsUseCase['execute']>>[number],
  ): PendingApprovalResponseDto {
    const dto = new PendingApprovalResponseDto()
    dto.details =
      domain.details == null
        ? domain.details
        : PendingApprovalResponseDetailsDto.fromDomain(domain.details)
    dto.id = domain.id
    dto.workflowId = domain.workflowId
    dto.referenceId = domain.referenceId
    dto.statusId = domain.statusId
    dto.currentStepSequence = domain.currentStepSequence
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    if (domain.workflow !== undefined)
      dto.workflow =
        domain.workflow == null
          ? domain.workflow
          : PendingApprovalResponseWorkflowDto.fromDomain(domain.workflow)
    if (domain.logs !== undefined)
      dto.logs =
        domain.logs == null
          ? domain.logs
          : domain.logs.map((x) => PendingApprovalResponseLogsDto.fromDomain(x))
    return dto
  }
}

export class ApprovalProcessResultResponseLogDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  instanceId!: string

  @ApiProperty({ type: Number })
  stepSequence!: number

  @ApiProperty({ type: String })
  approverId!: string

  @ApiProperty({ type: String })
  actionId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ enum: ['NONE', 'FINAL_APPROVAL', 'REJECTION'] })
  consequenceType!: 'NONE' | 'FINAL_APPROVAL' | 'REJECTION'

  @ApiProperty({ enum: ['NOT_REQUIRED', 'PENDING', 'COMPLETED', 'FAILED'] })
  consequenceStatus!: 'NOT_REQUIRED' | 'PENDING' | 'COMPLETED' | 'FAILED'

  @ApiProperty({ type: String, nullable: true })
  consequenceError!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  consequenceUpdatedAt!: string

  static fromDomain(
    domain: NonNullable<ProcessApprovalResult['log']>,
  ): ApprovalProcessResultResponseLogDto {
    const dto = new ApprovalProcessResultResponseLogDto()
    dto.id = domain.id
    dto.instanceId = domain.instanceId
    dto.stepSequence = domain.stepSequence
    dto.approverId = domain.approverId
    dto.actionId = domain.actionId
    dto.note = domain.note
    dto.createdAt = domain.createdAt.toISOString()
    dto.consequenceType = domain.consequenceType
    dto.consequenceStatus = domain.consequenceStatus
    dto.consequenceError = domain.consequenceError
    dto.consequenceUpdatedAt = domain.consequenceUpdatedAt.toISOString()
    return dto
  }
}

export class ApprovalProcessResultResponseConsequenceDto {
  @ApiProperty({ enum: ['NONE', 'FINAL_APPROVAL', 'REJECTION'] })
  type!: 'NONE' | 'FINAL_APPROVAL' | 'REJECTION'

  @ApiProperty({ enum: ['NOT_REQUIRED', 'PENDING', 'COMPLETED', 'FAILED'] })
  status!: 'NOT_REQUIRED' | 'PENDING' | 'COMPLETED' | 'FAILED'

  @ApiPropertyOptional({ type: String })
  error?: string

  static fromDomain(
    domain: NonNullable<ProcessApprovalResult['consequence']>,
  ): ApprovalProcessResultResponseConsequenceDto {
    const dto = new ApprovalProcessResultResponseConsequenceDto()
    dto.type = domain.type
    dto.status = domain.status
    dto.error = domain.error
    return dto
  }
}

export class ApprovalProcessResultResponseDto {
  @ApiProperty({ type: Boolean })
  success!: boolean

  @ApiProperty({ enum: ['REJECT', 'APPROVE_STEP', 'APPROVE_FINAL'] })
  action!: 'REJECT' | 'APPROVE_STEP' | 'APPROVE_FINAL'

  @ApiPropertyOptional({ type: Number })
  nextStepSequence?: number

  @ApiProperty({ type: () => ApprovalProcessResultResponseLogDto })
  log!: ApprovalProcessResultResponseLogDto

  @ApiProperty({ type: () => ApprovalProcessResultResponseConsequenceDto })
  consequence!: ApprovalProcessResultResponseConsequenceDto

  @ApiProperty({ type: Boolean })
  retryable!: boolean

  static fromDomain(
    domain: ProcessApprovalResult,
  ): ApprovalProcessResultResponseDto {
    const dto = new ApprovalProcessResultResponseDto()
    dto.success = domain.success
    dto.action = domain.action
    dto.nextStepSequence = domain.nextStepSequence
    dto.log = ApprovalProcessResultResponseLogDto.fromDomain(domain.log)
    dto.consequence = ApprovalProcessResultResponseConsequenceDto.fromDomain(
      domain.consequence,
    )
    dto.retryable = domain.retryable
    return dto
  }
}

export class RoleUsageResponseDto {
  @ApiProperty({ example: 'PRINCIPAL' })
  roleCode!: string

  @ApiProperty({ description: 'Active approval steps this role approves' })
  steps!: number

  @ApiProperty({
    type: [String],
    description: 'Active workflows with such a step',
  })
  workflows!: string[]
}
