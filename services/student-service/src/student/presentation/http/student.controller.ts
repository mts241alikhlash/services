import { MyClassroomResponseDto } from './dto/response/my-classroom-response.dto.js'
import {
  GetMyClassroomUseCase,
  type MyClassroom,
} from '../../application/use-cases/get-my-classroom/get-my-classroom.use-case.js'
import type { UserEntity } from '../../../shared/domain/entities/user.entity.js'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
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
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js'
import type { AuthenticatedUser } from '../../../core/types/authenticated-user.type.js'
import type { RequestUser } from '../../../core/types/request-user.type.js'
import { JwtAuthGuard } from '../../../platform/auth/index.js'
import { CreateStudentDto } from './dto/request/create-student.dto.js'
import { StudentQueryDto } from './dto/request/student-query.dto.js'
import {
  StudentListResponseDto,
  StudentResponseDto,
} from './dto/response/student-response.dto.js'
import { UpdateStudentDto } from './dto/request/update-student.dto.js'
import { CreateStudentUseCase } from '../../application/use-cases/create-student/create-student.use-case.js'
import { CreateStudentWithRelationsUseCase } from '../../application/use-cases/create-student-with-relations/create-student-with-relations.use-case.js'
import { DeleteStudentUseCase } from '../../application/use-cases/delete-student/delete-student.use-case.js'
import { GetStudentByIdUseCase } from '../../application/use-cases/get-student-by-id/get-student-by-id.use-case.js'
import { GetMyStudentUseCase } from '../../application/use-cases/get-my-student/get-my-student.use-case.js'
import { GetStudentsUseCase } from '../../application/use-cases/get-students/get-students.use-case.js'
import { ToggleStudentActiveUseCase } from '../../application/use-cases/toggle-student-active/toggle-student-active.use-case.js'
import { UpdateStudentUseCase } from '../../application/use-cases/update-student/update-student.use-case.js'
import { StudentWithDetails } from '../../domain/repositories/student.repository.js'
import { CreateStudentWithRelationsDto } from './dto/request/create-student-with-relations.dto.js'
import { EnrolExistingAccountDto } from './dto/request/enrol-existing-account.dto.js'
import { EnrolExistingAccountResponseDto } from './dto/response/enrol-existing-account-response.dto.js'
import { EnrolExistingAccountUseCase } from '../../application/use-cases/enrol-existing-account/enrol-existing-account.use-case.js'
import { PaginatedResponse } from '../../../shared/domain/interfaces/repository.interface.js'

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentController {
  constructor(
    private readonly getStudentsService: GetStudentsUseCase,
    private readonly getStudentByIdService: GetStudentByIdUseCase,
    private readonly getMyStudentService: GetMyStudentUseCase,
    private readonly getMyClassroomService: GetMyClassroomUseCase,
    private readonly createStudentService: CreateStudentUseCase,
    private readonly createStudentWithRelationsService: CreateStudentWithRelationsUseCase,
    private readonly updateStudentService: UpdateStudentUseCase,
    private readonly deleteStudentService: DeleteStudentUseCase,
    private readonly toggleStudentActiveService: ToggleStudentActiveUseCase,
    private readonly enrolExistingAccountService: EnrolExistingAccountUseCase,
  ) {}

  @Post('enrol')
  @RequirePermissions('students.create')
  @ApiOperation({
    summary: 'Enrol an existing account as a student (admission handover)',
  })
  @ApiResponse({
    status: 201,
    description: 'The student, whether created now or already present',
    type: EnrolExistingAccountResponseDto,
  })
  @ApiResponse({ status: 409, description: 'NIS or NISN already in use' })
  async enrol(@Body() dto: EnrolExistingAccountDto) {
    return this.enrolExistingAccountService.execute(dto)
  }

  @Get()
  @RequirePermissions('students.read')
  @ApiOperation({ summary: 'List all students (paginated, searchable)' })
  @ApiResponse({ status: 200, type: StudentListResponseDto })
  async findAll(
    @Query() query: StudentQueryDto,
  ): Promise<PaginatedResponse<StudentWithDetails>> {
    return this.getStudentsService.execute(query)
  }

  @Get('me')
  @RequirePermissions('students.read-own')
  @ApiOperation({
    summary: 'Your own student record — no id parameter exists',
  })
  @ApiResponse({ status: 200, type: StudentResponseDto })
  @ApiResponse({ status: 404, description: 'Not linked to a student record' })
  async findMine(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StudentWithDetails> {
    return this.getMyStudentService.execute(user.id)
  }

  @Get('me/classroom')
  @RequirePermissions('classrooms.read-own')
  @ApiOperation({
    summary: 'The classroom you are enrolled in — no id parameter exists',
  })
  @ApiResponse({
    status: 200,
    description: 'Your classroom, or null when you have no enrolment this term',
    type: MyClassroomResponseDto,
  })
  async findMyClassroom(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MyClassroom | null> {
    return this.getMyClassroomService.execute(user.id)
  }

  @Get(':id')
  @RequirePermissions('students.read')
  @ApiOperation({ summary: 'Get a student by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: StudentResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StudentWithDetails> {
    const reqUser: RequestUser = { id: user.id }
    return this.getStudentByIdService.execute(id, reqUser)
  }

  @Post()
  @RequirePermissions('students.create')
  @ApiOperation({ summary: 'Create a new student (User + Profile + Student)' })
  @ApiResponse({ status: 201, type: StudentResponseDto })
  @ApiResponse({ status: 404, description: 'Active semester not found' })
  @ApiResponse({ status: 409, description: 'Duplicate NIS or NISN' })
  async create(@Body() dto: CreateStudentDto): Promise<StudentResponseDto> {
    return this.createStudentService.execute(dto)
  }

  @Post('with-relations')
  @RequirePermissions('students.create')
  @ApiOperation({
    summary:
      'Create a student with address and parents atomically (single transaction)',
  })
  @ApiResponse({ status: 201, type: StudentResponseDto })
  @ApiResponse({
    status: 409,
    description: 'Duplicate NIS, NISN, or parent NIK',
  })
  async createWithRelations(
    @Body() dto: CreateStudentWithRelationsDto,
  ): Promise<StudentWithDetails> {
    return this.createStudentWithRelationsService.execute(dto)
  }

  @Patch(':id')
  @RequirePermissions('students.update')
  @ApiOperation({ summary: 'Update student master data (NIS, NISN, status)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: StudentResponseDto })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiResponse({ status: 409, description: 'Duplicate NIS or NISN' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentDto,
  ): Promise<StudentWithDetails> {
    return this.updateStudentService.execute(id, dto)
  }

  @Delete(':id')
  @RequirePermissions('students.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a student (also deactivates User)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Student deleted' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteStudentService.execute(id)
  }

  @Patch(':id/toggle-active')
  @RequirePermissions('students.update')
  @ApiOperation({
    summary: 'Activate or deactivate a student account (without deleting)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Account status updated' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async toggleActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('isActive', new ParseBoolPipe()) isActive: boolean,
  ): Promise<UserEntity> {
    return this.toggleStudentActiveService.execute(id, isActive)
  }
}
