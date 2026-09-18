import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator'
import {
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Public } from '../../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../../core/guards/provisioning-token.guard.js'
import { IEnrollmentRepository } from '../../domain/repositories/enrollment.repository.js'
import { EnrollmentStatus } from '../../../shared/domain/enums/index.js'

export class ActiveEnrollmentSummary {
  @ApiProperty() id!: string
  @ApiProperty() studentId!: string
  @ApiProperty() classroomId!: string
  @ApiProperty() semesterId!: string
  @ApiProperty({ nullable: true }) status!: string | null

  @ApiProperty({
    nullable: true,
    description: 'The account behind the student, for callers resolving a name',
  })
  studentUserId!: string | null

  @ApiProperty({ nullable: true }) studentNis!: string | null

  @ApiProperty({
    nullable: true,
    description: 'Resolved from identity-service by this service, not joined.',
  })
  studentName!: string | null
}

export class SearchEnrollmentsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  studentId?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  classroomId?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  semesterId?: string

  @ApiProperty({ required: false, default: 1000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2000)
  limit?: number
}

export class CountByClassroomsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('4', { each: true })
  classroomIds!: string[]

  @ApiProperty()
  @IsUUID()
  semesterId!: string
}

export class SemesterIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  semesterIds!: string[]
}

export class SemesterCountDto {
  @ApiProperty() semesterId!: string
  @ApiProperty() count!: number
}

export class SemesterCountListResponseDto {
  @ApiProperty({
    type: [SemesterCountDto],
    description: 'Terms with no live enrolment are absent, not zero.',
  })
  data!: SemesterCountDto[]
}

export class ClassroomCountDto {
  @ApiProperty() classroomId!: string
  @ApiProperty() count!: number
}

export class ClassroomCountListResponseDto {
  @ApiProperty({
    type: [ClassroomCountDto],
    description: 'Classrooms with no active enrolment are absent, not zero.',
  })
  data!: ClassroomCountDto[]
}

export class CountActiveDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(1000)
  @IsUUID('4', { each: true })
  ids!: string[]
}

export class RolloverEnrollmentsDto {
  @ApiProperty() @IsUUID() sourceSemesterId!: string
  @ApiProperty() @IsUUID() targetSemesterId!: string

  @ApiProperty({
    description:
      'Source classroom id -> target classroom id, built by academic-service.',
    example: { 'old-uuid': 'new-uuid' },
  })
  @IsObject()
  classroomIdMap!: Record<string, string>
}

export class RolloverEnrollmentsResponseDto {
  @ApiProperty()
  data!: { created: number; skipped: number }
}

export class EnrollmentListResponseDto {
  @ApiProperty({ type: [ActiveEnrollmentSummary] })
  data!: ActiveEnrollmentSummary[]
}

export class EnrollmentSummaryResponseDto {
  @ApiProperty({ type: ActiveEnrollmentSummary, nullable: true })
  data!: ActiveEnrollmentSummary | null
}

export class EnrollmentCountResponseDto {
  @ApiProperty({ description: 'Live enrolments. Soft-deleted excluded.' })
  data!: { count: number }
}

export class ActiveEnrollmentResponseDto {
  @ApiProperty({
    type: ActiveEnrollmentSummary,
    nullable: true,
    description: 'null when the student has no active enrolment',
  })
  data!: ActiveEnrollmentSummary | null
}

@ApiTags('Student Enrollments')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('student-enrollments')
export class EnrollmentInternalController {
  constructor(private readonly enrollmentRepository: IEnrollmentRepository) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enrolments matching a student, classroom or term',
    description:
      'The primitive behind every "rows for this classroom in this term" ' +
      'read in another service. Callers used to reach these by joining ' +
      '`student_enrollments` from their own tables; they resolve ids here ' +
      'and filter on their own foreign key instead. At least one filter is ' +
      'required — an unfiltered search is a whole-table read, not a query.',
  })
  @ApiResponse({ status: 200, type: EnrollmentListResponseDto })
  @ApiResponse({ status: 400, description: 'No filter given' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async search(
    @Body() dto: SearchEnrollmentsDto,
  ): Promise<EnrollmentListResponseDto> {
    if (!dto.studentId && !dto.classroomId && !dto.semesterId) {
      throw new BadRequestException(
        'At least one of studentId, classroomId or semesterId is required',
      )
    }

    const { data } = await this.enrollmentRepository.findAll({
      studentId: dto.studentId,
      classroomId: dto.classroomId,
      semesterId: dto.semesterId,
      page: 1,
      limit: dto.limit ?? 1000,
    })
    return { data: data.map(toSummary) }
  }

  @Post('count-by-classrooms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Active enrolment counts for a batch of classrooms in one term',
  })
  @ApiResponse({ status: 200, type: ClassroomCountListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async countByClassrooms(
    @Body() dto: CountByClassroomsDto,
  ): Promise<ClassroomCountListResponseDto> {
    return {
      data: await this.enrollmentRepository.countActiveByClassrooms(
        dto.classroomIds,
        dto.semesterId,
      ),
    }
  }

  @Post('count-by-semesters')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Live enrolment counts for a batch of terms',
    description:
      'academic-service asks this for its semester list, which offers a ' +
      'rollover only into a term that holds nothing yet. A term absent from ' +
      'the response holds nothing; a term the caller never asked about is a ' +
      'different thing entirely, and must not be read as empty.',
  })
  @ApiResponse({ status: 200, type: SemesterCountListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async countBySemesters(
    @Body() dto: SemesterIdsDto,
  ): Promise<SemesterCountListResponseDto> {
    return {
      data: await this.enrollmentRepository.countBySemesters(dto.semesterIds),
    }
  }

  @Get('active/:studentId')
  @ApiOperation({
    summary: "A student's active enrolment, as ids",
    description:
      'With `semesterId`, the active enrolment in that term rather than ' +
      'whichever one is current.',
  })
  @ApiResponse({ status: 200, type: ActiveEnrollmentResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async active(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('semesterId') semesterId?: string,
  ): Promise<ActiveEnrollmentResponseDto> {
    const enrolment = await this.enrollmentRepository.findActiveEnrollment(
      studentId,
      semesterId,
    )
    if (!enrolment) return { data: null }

    return { data: toSummary(enrolment) }
  }

  @Get('summary/:id')
  @ApiOperation({ summary: 'One enrolment, as ids' })
  @ApiResponse({ status: 200, type: EnrollmentSummaryResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async summary(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EnrollmentSummaryResponseDto> {
    const enrolment = await this.enrollmentRepository.findById(id)
    return { data: enrolment ? toSummary(enrolment) : null }
  }

  @Get('by-classroom/:classroomId')
  @ApiOperation({ summary: 'Active enrolments in a classroom and semester' })
  @ApiResponse({ status: 200, type: EnrollmentListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byClassroom(
    @Param('classroomId', ParseUUIDPipe) classroomId: string,
    @Query('semesterId') semesterId?: string,
    @Query('limit') limit?: string,
  ): Promise<EnrollmentListResponseDto> {
    const { data } = await this.enrollmentRepository.findAll({
      classroomId,
      semesterId,
      status: EnrollmentStatus.ACTIVE,
      page: 1,
      limit: Number(limit ?? 1000),
    })
    return { data: data.map(toSummary) }
  }

  @Post('by-ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enrolments for a batch of ids, as summaries' })
  @ApiResponse({ status: 200, type: EnrollmentListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byIds(@Body() dto: CountActiveDto): Promise<EnrollmentListResponseDto> {
    const rows = await this.enrollmentRepository.findManyActiveByIds(dto.ids)
    return { data: rows.map(toSummary) }
  }

  @Post('rollover')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Carry active enrolments into the next semester',
    description:
      'academic-service copies the classrooms first and sends the resulting ' +
      'id map here. Idempotent per student: a student already enrolled in ' +
      'the target semester is skipped, so a failed run is repaired by ' +
      'repeating it.',
  })
  @ApiResponse({ status: 200, type: RolloverEnrollmentsResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async rollover(
    @Body() dto: RolloverEnrollmentsDto,
  ): Promise<RolloverEnrollmentsResponseDto> {
    return {
      data: await this.enrollmentRepository.rolloverToSemester(
        dto.sourceSemesterId,
        dto.targetSemesterId,
        new Map(Object.entries(dto.classroomIdMap)),
      ),
    }
  }

  @Post('count-active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'How many of these enrolment ids are active' })
  @ApiResponse({ status: 200, type: EnrollmentCountResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async countActive(
    @Body() dto: CountActiveDto,
  ): Promise<EnrollmentCountResponseDto> {
    return {
      data: {
        count: await this.enrollmentRepository.countActiveByIds(dto.ids),
      },
    }
  }

  @Get('count-by-classroom/:classroomId')
  @ApiOperation({ summary: 'Live enrolments in a classroom' })
  @ApiResponse({ status: 200, type: EnrollmentCountResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async countByClassroom(
    @Param('classroomId', ParseUUIDPipe) classroomId: string,
  ): Promise<EnrollmentCountResponseDto> {
    return {
      data: {
        count: await this.enrollmentRepository.countByClassroom(classroomId),
      },
    }
  }

  @Get('count-by-semester/:semesterId')
  @ApiOperation({ summary: 'Live enrolments in a semester' })
  @ApiResponse({ status: 200, type: EnrollmentCountResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async countBySemester(
    @Param('semesterId', ParseUUIDPipe) semesterId: string,
  ): Promise<EnrollmentCountResponseDto> {
    return {
      data: {
        count: await this.enrollmentRepository.countBySemester(semesterId),
      },
    }
  }
}

function toSummary(enrolment: {
  id: string
  studentId: string
  classroomId: string
  semesterId: string
  status?: string | null
  student?: {
    userId?: string | null
    nis?: string | null
    user?: { profile?: { name?: string | null } | null } | null
  } | null
}): ActiveEnrollmentSummary {
  return {
    id: enrolment.id,
    studentId: enrolment.studentId,
    classroomId: enrolment.classroomId,
    semesterId: enrolment.semesterId,
    status: enrolment.status ?? null,
    studentUserId: enrolment.student?.userId ?? null,
    studentNis: enrolment.student?.nis ?? null,
    studentName: enrolment.student?.user?.profile?.name ?? null,
  }
}
