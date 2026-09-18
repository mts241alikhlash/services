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

import { DropStudentDto } from './dto/request/drop-student.dto.js'
import { BulkCreateStudentEnrollmentDto } from './dto/request/bulk-create-student-enrollment.dto.js'
import { CreateStudentEnrollmentDto } from './dto/request/create-student-enrollment.dto.js'
import { StudentEnrollmentQueryDto } from './dto/request/student-enrollment-query.dto.js'
import { UpdateStudentEnrollmentDto } from './dto/request/update-student-enrollment.dto.js'
import { TransferStudentDto } from './dto/request/transfer-student.dto.js'
import { BulkTransferStudentDto } from './dto/request/bulk-transfer-student.dto.js'
import { BulkCreateStudentEnrollmentUseCase } from '../../application/use-cases/bulk-create-student-enrollment/bulk-create-student-enrollment.use-case.js'
import { CreateStudentEnrollmentUseCase } from '../../application/use-cases/create-student-enrollment/create-student-enrollment.use-case.js'
import { DeleteStudentEnrollmentUseCase } from '../../application/use-cases/delete-student-enrollment/delete-student-enrollment.use-case.js'
import { DropStudentUseCase } from '../../application/use-cases/drop-student/drop-student.use-case.js'
import { GetStudentEnrollmentByIdUseCase } from '../../application/use-cases/get-student-enrollment-by-id/get-student-enrollment-by-id.use-case.js'
import { GetStudentEnrollmentsUseCase } from '../../application/use-cases/get-student-enrollments/get-student-enrollments.use-case.js'
import { TransferStudentUseCase } from '../../application/use-cases/transfer-student/transfer-student.use-case.js'
import { BulkTransferStudentUseCase } from '../../application/use-cases/bulk-transfer-student/bulk-transfer-student.use-case.js'
import { UpdateStudentEnrollmentUseCase } from '../../application/use-cases/update-student-enrollment/update-student-enrollment.use-case.js'

@ApiTags('Enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('student-enrollments')
export class EnrollmentController {
  constructor(
    private readonly getAll: GetStudentEnrollmentsUseCase,
    private readonly getById: GetStudentEnrollmentByIdUseCase,
    private readonly createUC: CreateStudentEnrollmentUseCase,
    private readonly bulkCreateUC: BulkCreateStudentEnrollmentUseCase,
    private readonly updateUC: UpdateStudentEnrollmentUseCase,
    private readonly deleteUC: DeleteStudentEnrollmentUseCase,
    private readonly transferUC: TransferStudentUseCase,
    private readonly bulkTransferUC: BulkTransferStudentUseCase,
    private readonly dropUC: DropStudentUseCase,
  ) {}

  @Get()
  @RequirePermissions('enrollments.read')
  @ApiOperation({ summary: 'List student enrollments' })
  async findAll(@Query() q: StudentEnrollmentQueryDto) {
    return this.getAll.execute(q)
  }

  @Get(':id')
  @RequirePermissions('enrollments.read')
  @ApiOperation({ summary: 'Get enrollment by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getById.execute(id)
  }

  @Post()
  @RequirePermissions('enrollments.create')
  @ApiOperation({ summary: 'Create enrollment' })
  async create(@Body() dto: CreateStudentEnrollmentDto) {
    return this.createUC.execute(dto)
  }

  @Post('bulk')
  @RequirePermissions('enrollments.create')
  @ApiOperation({ summary: 'Bulk create enrollments' })
  async bulkCreate(@Body() dto: BulkCreateStudentEnrollmentDto) {
    return this.bulkCreateUC.execute(dto)
  }

  @Patch(':id')
  @RequirePermissions('enrollments.update')
  @ApiOperation({ summary: 'Update enrollment' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentEnrollmentDto,
  ) {
    return this.updateUC.execute(id, dto)
  }

  @Patch(':id/transfer')
  @RequirePermissions('enrollments.update')
  @ApiOperation({ summary: 'Transfer student to a different class' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Student transferred' })
  @ApiResponse({ status: 400, description: 'Enrollment is not ACTIVE' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferStudentDto,
  ) {
    return this.transferUC.execute(id, dto)
  }

  @Post('bulk-transfer')
  @RequirePermissions('enrollments.create')
  @ApiOperation({ summary: 'Bulk transfer students to a different class' })
  @ApiResponse({ status: 201, description: 'Bulk transfer completed' })
  async bulkTransfer(@Body() dto: BulkTransferStudentDto) {
    return this.bulkTransferUC.execute(dto)
  }

  @Patch(':id/drop')
  @RequirePermissions('enrollments.update')
  @ApiOperation({ summary: 'Drop a student from enrollment' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Student dropped' })
  @ApiResponse({ status: 400, description: 'Enrollment is not ACTIVE' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async drop(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DropStudentDto,
  ) {
    return this.dropUC.execute(id, dto)
  }

  @Delete(':id')
  @RequirePermissions('enrollments.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete enrollment' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteUC.execute(id)
  }
}
