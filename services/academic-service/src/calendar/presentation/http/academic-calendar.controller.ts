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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

import { JwtAuthGuard } from '../../../platform/auth/index.js'

import { AcademicCalendarQueryDto } from './dto/request/academic-calendar-query.dto.js'
import { BulkDeleteAcademicCalendarsDto } from './dto/request/bulk-delete-academic-calendars.dto.js'
import { CreateAcademicCalendarDto } from './dto/request/create-academic-calendar.dto.js'
import { UpdateAcademicCalendarDto } from './dto/request/update-academic-calendar.dto.js'
import { BulkDeleteAcademicCalendarsUseCase } from '../../application/use-cases/bulk-delete-academic-calendars/bulk-delete-academic-calendars.use-case.js'
import { CreateAcademicCalendarUseCase } from '../../application/use-cases/create-academic-calendar/create-academic-calendar.use-case.js'
import { DeleteAcademicCalendarUseCase } from '../../application/use-cases/delete-academic-calendar/delete-academic-calendar.use-case.js'
import { GetAcademicCalendarByIdUseCase } from '../../application/use-cases/get-academic-calendar-by-id/get-academic-calendar-by-id.use-case.js'
import { GetAcademicCalendarsUseCase } from '../../application/use-cases/get-academic-calendars/get-academic-calendars.use-case.js'
import { UpdateAcademicCalendarUseCase } from '../../application/use-cases/update-academic-calendar/update-academic-calendar.use-case.js'

@ApiTags('Academic Calendar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('academic-calendars')
export class AcademicCalendarController {
  constructor(
    private readonly getAcademicCalendarsService: GetAcademicCalendarsUseCase,
    private readonly getAcademicCalendarByIdService: GetAcademicCalendarByIdUseCase,
    private readonly createAcademicCalendarService: CreateAcademicCalendarUseCase,
    private readonly updateAcademicCalendarService: UpdateAcademicCalendarUseCase,
    private readonly deleteAcademicCalendarService: DeleteAcademicCalendarUseCase,
    private readonly bulkDeleteAcademicCalendarsService: BulkDeleteAcademicCalendarsUseCase,
  ) {}

  @Get()
  @RequirePermissions('academic-calendars.read')
  @ApiOperation({
    summary: 'List academic calendar entries (paginated, filterable)',
  })
  @ApiResponse({ status: 200, description: 'Paginated academic calendar list' })
  async findAll(@Query() query: AcademicCalendarQueryDto) {
    return this.getAcademicCalendarsService.execute(query)
  }

  @Get(':id')
  @RequirePermissions('academic-calendars.read')
  @ApiOperation({ summary: 'Get academic calendar entry by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Academic calendar entry' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getAcademicCalendarByIdService.execute(id)
  }

  @Post()
  @RequirePermissions('academic-calendars.create')
  @ApiOperation({ summary: 'Create a new academic calendar entry' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({
    status: 404,
    description: 'Academic year or semester not found',
  })
  async create(@Body() dto: CreateAcademicCalendarDto) {
    return this.createAcademicCalendarService.execute(dto)
  }

  @Patch(':id')
  @RequirePermissions('academic-calendars.update')
  @ApiOperation({ summary: 'Update an academic calendar entry' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Updated' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademicCalendarDto,
  ) {
    return this.updateAcademicCalendarService.execute(id, dto)
  }

  @Delete('bulk')
  @RequirePermissions('academic-calendars.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete several academic calendar entries' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'At least one id was not found' })
  async removeMany(@Body() dto: BulkDeleteAcademicCalendarsDto) {
    await this.bulkDeleteAcademicCalendarsService.execute(dto.ids)
  }

  @Delete(':id')
  @RequirePermissions('academic-calendars.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an academic calendar entry' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteAcademicCalendarService.execute(id)
  }
}
