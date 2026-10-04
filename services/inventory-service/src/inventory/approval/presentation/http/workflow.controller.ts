import {
  ApprovalWorkflowResponseDto,
  RoleUsageResponseDto,
} from './dto/response/approval-response.dto.js'
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../../platform/auth/index.js'
import { RequirePermissions } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { CreateWorkflowDto } from './dto/request/create-workflow.dto.js'
import { CreateWorkflowUseCase } from '../../application/use-cases/create-workflow/create-workflow.use-case.js'
import { GetWorkflowsUseCase } from '../../application/use-cases/get-workflows/get-workflows.use-case.js'
import { GetWorkflowByIdUseCase } from '../../application/use-cases/get-workflow-by-id/get-workflow-by-id.use-case.js'
import { GetRoleUsageUseCase } from '../../application/use-cases/get-role-usage/get-role-usage.use-case.js'

@ApiTags('Inventory Workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory/workflows')
export class WorkflowController {
  constructor(
    private readonly getWorkflowsUseCase: GetWorkflowsUseCase,
    private readonly getWorkflowByIdUseCase: GetWorkflowByIdUseCase,
    private readonly createWorkflowUseCase: CreateWorkflowUseCase,
    private readonly getRoleUsageUseCase: GetRoleUsageUseCase,
  ) {}

  @Get('role-usage')
  @RequirePermissions('roles.read')
  @ApiOperation({
    summary:
      'Which roles approve steps of active workflows, for the role screen',
  })
  @ApiResponse({ status: 200, type: RoleUsageResponseDto, isArray: true })
  async roleUsage(): Promise<RoleUsageResponseDto[]> {
    return this.getRoleUsageUseCase.execute()
  }

  @Get()
  @RequirePermissions('inventory-approvals.read')
  @ApiOperation({ summary: 'List all workflow templates' })
  async findAll(): Promise<ApprovalWorkflowResponseDto[]> {
    return (await this.getWorkflowsUseCase.execute()).map((item) =>
      ApprovalWorkflowResponseDto.fromDomain(item),
    )
  }

  @Get(':id')
  @RequirePermissions('inventory-approvals.read')
  @ApiOperation({ summary: 'Get workflow template by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApprovalWorkflowResponseDto> {
    return ApprovalWorkflowResponseDto.fromDomain(
      await this.getWorkflowByIdUseCase.execute(id),
    )
  }

  @Post()
  @RequirePermissions('inventory-approvals.create')
  @ApiOperation({ summary: 'Create a new workflow template' })
  async create(
    @Body() dto: CreateWorkflowDto,
  ): Promise<ApprovalWorkflowResponseDto> {
    return ApprovalWorkflowResponseDto.fromDomain(
      await this.createWorkflowUseCase.execute(dto),
    )
  }
}
