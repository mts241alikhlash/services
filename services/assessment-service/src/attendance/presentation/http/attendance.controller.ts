import {
  AttendanceBulkResultResponseDto,
  AttendanceListResponseDto,
  AttendanceRecapResponseDto,
  AttendanceResponseDto,
  AttendanceSuggestionsResponseDto,
  AttendanceTrendResponseDto,
} from './dto/response/attendance-response.dto.js'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'

import { JwtAuthGuard } from '../../../platform/auth/index.js'
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js'
import type { AuthenticatedUser } from '../../../core/types/authenticated-user.type.js'

import { CreateAttendanceDto } from './dto/request/create-attendance.dto.js'
import { UpdateAttendanceDto } from './dto/request/update-attendance.dto.js'
import { AttendanceQueryDto } from './dto/request/attendance-query.dto.js'
import { BulkUpsertAttendanceDto } from './dto/request/bulk-upsert-attendance.dto.js'
import { AttendanceRecapQueryDto } from './dto/request/attendance-recap-query.dto.js'
import { AttendanceTrendQueryDto } from './dto/request/attendance-trend-query.dto.js'
import { GetAttendancesUseCase } from '../../application/use-cases/get-attendances/get-attendances.use-case.js'
import { GetMyAttendancesUseCase } from '../../application/use-cases/get-my-attendances/get-my-attendances.use-case.js'
import { GetAttendanceByIdUseCase } from '../../application/use-cases/get-attendance-by-id/get-attendance-by-id.use-case.js'
import { CreateAttendanceUseCase } from '../../application/use-cases/create-attendance/create-attendance.use-case.js'
import { UpdateAttendanceUseCase } from '../../application/use-cases/update-attendance/update-attendance.use-case.js'
import { DeleteAttendanceUseCase } from '../../application/use-cases/delete-attendance/delete-attendance.use-case.js'
import { BulkUpsertAttendanceUseCase } from '../../application/use-cases/bulk-upsert-attendance/bulk-upsert-attendance.use-case.js'
import { GetAttendanceRecapUseCase } from '../../application/use-cases/get-attendance-recap/get-attendance-recap.use-case.js'
import { GetAttendanceTrendUseCase } from '../../application/use-cases/get-attendance-trend/get-attendance-trend.use-case.js'
import {
  AttendanceSuggestionResult,
  GetAttendanceSuggestionsUseCase,
} from '../../application/use-cases/get-attendance-suggestions/get-attendance-suggestions.use-case.js'
import { AttendanceSuggestionQueryDto } from './dto/request/attendance-suggestion-query.dto.js'

@ApiTags('Attendances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendances')
export class AttendanceController {
  constructor(
    private readonly getAll: GetAttendancesUseCase,
    private readonly getMine: GetMyAttendancesUseCase,
    private readonly getById: GetAttendanceByIdUseCase,
    private readonly createUC: CreateAttendanceUseCase,
    private readonly updateUC: UpdateAttendanceUseCase,
    private readonly deleteUC: DeleteAttendanceUseCase,
    private readonly bulkUpsertUC: BulkUpsertAttendanceUseCase,
    private readonly recapUC: GetAttendanceRecapUseCase,
    private readonly trendUC: GetAttendanceTrendUseCase,
    private readonly suggestionsUC: GetAttendanceSuggestionsUseCase,
  ) {}

  @Get('suggestions')
  @RequirePermissions('attendances.read')
  @ApiOperation({ summary: 'Gate pre-fill for a class, unconfirmed' })
  async suggestions(
    @Query() query: AttendanceSuggestionQueryDto,
  ): Promise<AttendanceSuggestionsResponseDto> {
    return AttendanceSuggestionsResponseDto.fromDomain(
      await this.suggestionsUC.execute(query),
    )
  }

  @Get()
  @RequirePermissions('attendances.read')
  @ApiOperation({ summary: 'List attendances' })
  async findAll(
    @Query() q: AttendanceQueryDto,
  ): Promise<AttendanceListResponseDto> {
    return AttendanceListResponseDto.fromDomain(await this.getAll.execute(q))
  }

  @Get('me')
  @RequirePermissions('attendances.read-own')
  @ApiOperation({
    summary: 'Your own attendance — no student parameter exists',
  })
  async findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() q: AttendanceQueryDto,
  ): Promise<AttendanceListResponseDto> {
    return AttendanceListResponseDto.fromDomain(
      await this.getMine.execute(q, user.id),
    )
  }

  @Get('recap')
  @RequirePermissions('attendances.read')
  @ApiOperation({ summary: 'Get attendance recap per student' })
  async getRecap(
    @Query() q: AttendanceRecapQueryDto,
  ): Promise<AttendanceRecapResponseDto[]> {
    return (await this.recapUC.execute(q)).map((item) =>
      AttendanceRecapResponseDto.fromDomain(item),
    )
  }

  @Get('recap/trend')
  @RequirePermissions('attendances.read')
  @ApiOperation({
    summary: 'Get monthly attendance percentage trend for a classroom',
  })
  async getTrend(
    @Query() q: AttendanceTrendQueryDto,
  ): Promise<AttendanceTrendResponseDto[]> {
    return (await this.trendUC.execute(q)).map((item) =>
      AttendanceTrendResponseDto.fromDomain(item),
    )
  }

  @Get(':id')
  @RequirePermissions('attendances.read')
  @ApiOperation({ summary: 'Get attendance by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AttendanceResponseDto> {
    return AttendanceResponseDto.fromDomain(await this.getById.execute(id))
  }

  @Post()
  @RequirePermissions('attendances.manage')
  @ApiOperation({ summary: 'Create attendance' })
  async create(
    @Body() dto: CreateAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    return AttendanceResponseDto.fromDomain(await this.createUC.execute(dto))
  }

  @Post('bulk')
  @RequirePermissions('attendances.manage')
  @ApiOperation({ summary: 'Bulk upsert attendances for a date' })
  async bulkUpsert(
    @Body() dto: BulkUpsertAttendanceDto,
  ): Promise<AttendanceBulkResultResponseDto> {
    return AttendanceBulkResultResponseDto.fromDomain(
      await this.bulkUpsertUC.execute(dto),
    )
  }

  @Patch(':id')
  @RequirePermissions('attendances.update')
  @ApiOperation({ summary: 'Update attendance' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    return AttendanceResponseDto.fromDomain(
      await this.updateUC.execute(id, dto),
    )
  }

  @Delete(':id')
  @RequirePermissions('attendances.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete attendance' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteUC.execute(id)
  }
}
