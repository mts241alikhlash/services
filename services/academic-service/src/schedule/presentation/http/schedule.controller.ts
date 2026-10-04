import {
  MyScheduleResponseDto,
  ScheduleBatchResultResponseDto,
  ScheduleItemResponseDto,
  SchedulePageResponseDto,
} from './dto/response/schedule-api-response.dto.js'
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
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../platform/auth/index.js'
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js'
import type { AuthenticatedUser } from '../../../core/types/authenticated-user.type.js'
import { BatchUpsertScheduleDto } from './dto/request/batch-upsert-schedule.dto.js'
import { CreateScheduleDto } from './dto/request/create-schedule.dto.js'
import { UpdateScheduleDto } from './dto/request/update-schedule.dto.js'
import { ScheduleQueryDto } from './dto/request/schedule-query.dto.js'
import { GetSchedulesUseCase } from '../../application/use-cases/get-schedules/get-schedules.use-case.js'
import { GetMyScheduleUseCase } from '../../application/use-cases/get-my-schedule/get-my-schedule.use-case.js'
import { GetScheduleByIdUseCase } from '../../application/use-cases/get-schedule-by-id/get-schedule-by-id.use-case.js'
import { GetSchedulesByClassroomUseCase } from '../../application/use-cases/get-schedules-by-classroom/get-schedules-by-classroom.use-case.js'
import { CreateScheduleUseCase } from '../../application/use-cases/create-schedule/create-schedule.use-case.js'
import { UpdateScheduleUseCase } from '../../application/use-cases/update-schedule/update-schedule.use-case.js'
import { DeleteScheduleUseCase } from '../../application/use-cases/delete-schedule/delete-schedule.use-case.js'
import { BatchUpsertScheduleUseCase } from '../../application/use-cases/batch-upsert-schedule/batch-upsert-schedule.use-case.js'

@ApiTags('Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schedules')
export class ScheduleController {
  constructor(
    private readonly getAll: GetSchedulesUseCase,
    private readonly getMine: GetMyScheduleUseCase,
    private readonly getById: GetScheduleByIdUseCase,
    private readonly getByClassroom: GetSchedulesByClassroomUseCase,
    private readonly createUC: CreateScheduleUseCase,
    private readonly updateUC: UpdateScheduleUseCase,
    private readonly deleteUC: DeleteScheduleUseCase,
    private readonly batchUpsertUC: BatchUpsertScheduleUseCase,
  ) {}

  @Get()
  @RequirePermissions('schedules.read')
  @ApiOperation({ summary: 'List schedules' })
  async findAll(
    @Query() q: ScheduleQueryDto,
  ): Promise<SchedulePageResponseDto> {
    return SchedulePageResponseDto.fromDomain(await this.getAll.execute(q))
  }

  @Get('me')
  @RequirePermissions('schedules.read-own')
  @ApiOperation({
    summary:
      'Your own schedule — your classroom timetable, your teaching, or both',
  })
  async findMine(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MyScheduleResponseDto> {
    return MyScheduleResponseDto.fromDomain(await this.getMine.execute(user.id))
  }

  @Get('classroom/:classroomId')
  @RequirePermissions('schedules.read')
  @ApiOperation({ summary: 'Get all schedules for a classroom' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  async findByClassroom(
    @Param('classroomId', ParseUUIDPipe) classroomId: string,
  ): Promise<ScheduleItemResponseDto[]> {
    const schedules = await this.getByClassroom.execute(classroomId)
    return schedules.map((item) => ScheduleItemResponseDto.fromDomain(item))
  }

  @Put('classroom/:classroomId/batch')
  @RequirePermissions('schedules.update')
  @ApiOperation({ summary: 'Batch upsert schedules for a classroom by day' })
  @ApiParam({ name: 'classroomId', format: 'uuid' })
  async batchUpsert(
    @Param('classroomId', ParseUUIDPipe) classroomId: string,
    @Body() dto: BatchUpsertScheduleDto,
  ): Promise<ScheduleBatchResultResponseDto> {
    return ScheduleBatchResultResponseDto.fromDomain(
      await this.batchUpsertUC.execute(classroomId, dto),
    )
  }

  @Get(':id')
  @RequirePermissions('schedules.read')
  @ApiOperation({ summary: 'Get schedule by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ScheduleItemResponseDto> {
    return ScheduleItemResponseDto.fromDomain(await this.getById.execute(id))
  }

  @Post()
  @RequirePermissions('schedules.create')
  @ApiOperation({ summary: 'Create schedule' })
  async create(
    @Body() dto: CreateScheduleDto,
  ): Promise<ScheduleItemResponseDto> {
    return ScheduleItemResponseDto.fromDomain(await this.createUC.execute(dto))
  }

  @Patch(':id')
  @RequirePermissions('schedules.update')
  @ApiOperation({ summary: 'Update schedule' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScheduleDto,
  ): Promise<ScheduleItemResponseDto> {
    return ScheduleItemResponseDto.fromDomain(
      await this.updateUC.execute(id, dto),
    )
  }

  @Delete(':id')
  @RequirePermissions('schedules.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete schedule' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteUC.execute(id)
  }
}
