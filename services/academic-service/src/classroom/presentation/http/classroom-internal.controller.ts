import {
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
import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator'
import {
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Public } from '../../../core/decorators/public.decorator.js'
import { withDisplayName } from '../../../shared/utils/classroom-display-name.helper.js'
import { ProvisioningTokenGuard } from '../../../core/guards/provisioning-token.guard.js'
import { IClassroomRepository } from '../../domain/repositories/classroom.repository.js'
import { IClassroomStructureRepository } from '../../domain/repositories/classroom-structure.repository.js'
import { IClassroomSupervisorRepository } from '../../domain/repositories/classroom-supervisor.repository.js'
import { ITeachingAssignmentRepository } from '../../../teaching-assignment/domain/repositories/teaching-assignment.repository.js'

export class ClassroomSummaryDto {
  @ApiProperty() id!: string
  @ApiProperty() code!: string
  @ApiProperty({ nullable: true }) name!: string | null
}

export class ClassroomCodesResponseDto {
  @ApiProperty({ type: [String] })
  data!: string[]
}

export class GradeLevelRefDto {
  @ApiProperty() level!: number
  @ApiProperty({ nullable: true }) name!: string | null
}

export class GradeLevelsResponseDto {
  @ApiProperty({ type: [GradeLevelRefDto] })
  data!: GradeLevelRefDto[]
}

export class ClassroomContextResponseDto {
  @ApiProperty()
  data!: {
    classroom: unknown
    structure: unknown
    supervisor: unknown
    subjects: unknown[]
  } | null
}

export class ClassroomDetailDto {
  @ApiProperty() id!: string
  @ApiProperty() code!: string
  @ApiProperty({ nullable: true }) name!: string | null
  @ApiProperty() gradeId!: string
  @ApiProperty() academicYearId!: string
  @ApiProperty() capacity!: number
  @ApiProperty({ nullable: true }) gradeLevel!: number | null
  @ApiProperty({ nullable: true }) gradeName!: string | null
}

export class ClassroomDetailResponseDto {
  @ApiProperty({ type: ClassroomDetailDto, nullable: true })
  data!: ClassroomDetailDto | null
}

export class SupervisedClassroomDto {
  @ApiProperty() id!: string
  @ApiProperty() code!: string
  @ApiProperty({ nullable: true }) name!: string | null
}

export class SupervisedClassroomListResponseDto {
  @ApiProperty({ type: [SupervisedClassroomDto] })
  data!: SupervisedClassroomDto[]
}

export class SupervisesResponseDto {
  @ApiProperty()
  data!: { supervises: boolean }
}

export class ClassroomIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('4', { each: true })
  ids!: string[]
}

export class ClassroomDetailListResponseDto {
  @ApiProperty({ type: [ClassroomDetailDto] })
  data!: ClassroomDetailDto[]
}

export class ClassroomSummaryResponseDto {
  @ApiProperty({ type: ClassroomSummaryDto, nullable: true })
  data!: ClassroomSummaryDto | null
}

@ApiTags('Classrooms')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('classrooms')
export class ClassroomInternalController {
  constructor(
    private readonly classroomRepository: IClassroomRepository,
    private readonly structureRepository: IClassroomStructureRepository,
    private readonly supervisorRepository: IClassroomSupervisorRepository,
    private readonly teachingAssignmentRepository: ITeachingAssignmentRepository,
  ) {}

  @Get('codes')
  @ApiOperation({
    summary: 'Active classroom codes, for bulk-import validation',
  })
  @ApiResponse({ status: 200, type: ClassroomCodesResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async codes(): Promise<ClassroomCodesResponseDto> {
    const { data } = await this.classroomRepository.findAll({
      page: 1,
      limit: 1000,
      isActive: true,
    })
    return { data: data.map((classroom) => classroom.code).sort() }
  }

  @Get('grade-levels')
  @ApiOperation({
    summary: "Distinct grade levels used by an academic year's classrooms",
  })
  @ApiResponse({ status: 200, type: GradeLevelsResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async gradeLevels(
    @Query('academicYearId') academicYearId?: string,
  ): Promise<GradeLevelsResponseDto> {
    const { data } = await this.classroomRepository.findAll({
      page: 1,
      limit: 1000,
      academicYearId,
    })
    const byLevel = new Map<number, GradeLevelRefDto>()
    for (const classroom of data) {
      const grade = classroom.grade
      if (grade && !byLevel.has(grade.level)) {
        byLevel.set(grade.level, {
          level: grade.level,
          name: grade.name ?? null,
        })
      }
    }
    return { data: [...byLevel.values()].sort((a, b) => a.level - b.level) }
  }

  @Get('supervised')
  @ApiOperation({
    summary: 'Classrooms an employee is homeroom teacher of, for one term',
  })
  @ApiResponse({ status: 200, type: SupervisedClassroomListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async supervised(
    @Query('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('semesterId', ParseUUIDPipe) semesterId: string,
  ): Promise<SupervisedClassroomListResponseDto> {
    return {
      data: await this.supervisorRepository.listSupervisedClassrooms(
        employeeId,
        semesterId,
      ),
    }
  }

  @Get('supervises')
  @ApiOperation({
    summary: 'Whether an employee is homeroom teacher of a classroom that term',
    description:
      'assessment-service asks this before letting a homeroom teacher edit a ' +
      'report card, which is the one authorisation it cannot answer from its ' +
      'own tables.',
  })
  @ApiResponse({ status: 200, type: SupervisesResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async supervises(
    @Query('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('classroomId', ParseUUIDPipe) classroomId: string,
    @Query('semesterId', ParseUUIDPipe) semesterId: string,
  ): Promise<SupervisesResponseDto> {
    return {
      data: {
        supervises: await this.supervisorRepository.supervises(
          employeeId,
          classroomId,
          semesterId,
        ),
      },
    }
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Resolve a classroom by its code' })
  @ApiResponse({ status: 200, type: ClassroomSummaryResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byCode(
    @Param('code') code: string,
  ): Promise<ClassroomSummaryResponseDto> {
    const classroom = await this.classroomRepository.findByCode(code)
    return { data: classroom ? toSummary(classroom) : null }
  }

  @Get(':id/context')
  @ApiOperation({
    summary: 'A classroom with its officers, homeroom teacher and subjects',
  })
  @ApiResponse({ status: 200, type: ClassroomContextResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async context(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('semesterId') semesterId?: string,
    @Query('subjectLimit') subjectLimit?: string,
  ): Promise<ClassroomContextResponseDto> {
    const classroom = await this.classroomRepository.findById(id)
    if (!classroom) return { data: null }

    const scope = { classroomId: id, semesterId }
    const [structures, supervisors, subjects] = await Promise.all([
      this.structureRepository.findAll({ ...scope, page: 1, limit: 1 }),
      this.supervisorRepository.findAll({ ...scope, page: 1, limit: 1 }),
      this.teachingAssignmentRepository.findAll({
        ...scope,
        page: 1,
        limit: Number(subjectLimit ?? 100),
      }),
    ])

    return {
      data: {
        classroom: withDisplayName(classroom),
        structure: structures.data[0] ?? null,
        supervisor: supervisors.data[0] ?? null,
        subjects: subjects.data,
      },
    }
  }

  @Post('by-ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Classrooms for a batch of ids',
    description:
      'Labels rows that reference a classroom by id — an enrolment list ' +
      'spans whichever years the rows happen to touch, so it cannot be ' +
      'answered by the per-year endpoint. Ids that match nothing are ' +
      'absent from the response rather than returned as null.',
  })
  @ApiResponse({ status: 200, type: ClassroomDetailListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byIds(
    @Body() dto: ClassroomIdsDto,
  ): Promise<ClassroomDetailListResponseDto> {
    const classrooms = await this.classroomRepository.findDetailsByIds(dto.ids)
    return { data: classrooms.map(toDetail) }
  }

  @Get('by-academic-year/:academicYearId')
  @ApiOperation({
    summary: "An academic year's classrooms, by grade level then code",
  })
  @ApiResponse({ status: 200, type: ClassroomDetailListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byAcademicYear(
    @Param('academicYearId', ParseUUIDPipe) academicYearId: string,
  ): Promise<ClassroomDetailListResponseDto> {
    const { data } = await this.classroomRepository.findAll({
      page: 1,
      limit: 1000,
      academicYearId,
    })
    return { data: data.map(toDetail).sort(byGradeThenCode) }
  }

  @Get(':id/detail')
  @ApiOperation({ summary: 'A classroom with its grade level' })
  @ApiResponse({ status: 200, type: ClassroomDetailResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async detail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClassroomDetailResponseDto> {
    const classroom = await this.classroomRepository.findById(id)
    return { data: classroom ? toDetail(classroom) : null }
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Classroom name' })
  @ApiResponse({ status: 200, type: ClassroomSummaryResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async summary(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClassroomSummaryResponseDto> {
    const classroom = await this.classroomRepository.findById(id)
    return { data: classroom ? toSummary(classroom) : null }
  }
}

function toSummary(classroom: {
  id: string
  code: string
  name?: string | null
}): ClassroomSummaryDto {
  return {
    id: classroom.id,
    code: classroom.code,
    name: classroom.name ?? null,
  }
}

function toDetail(classroom: {
  id: string
  code: string
  name?: string | null
  gradeId: string
  academicYearId: string
  capacity: number
  grade?: { level: number; name: string } | null
}): ClassroomDetailDto {
  return {
    id: classroom.id,
    code: classroom.code,
    name: classroom.name ?? null,
    gradeId: classroom.gradeId,
    academicYearId: classroom.academicYearId,
    capacity: classroom.capacity,
    gradeLevel: classroom.grade?.level ?? null,
    gradeName: classroom.grade?.name ?? null,
  }
}

function byGradeThenCode(a: ClassroomDetailDto, b: ClassroomDetailDto): number {
  const levelDiff = (a.gradeLevel ?? 0) - (b.gradeLevel ?? 0)
  return levelDiff !== 0 ? levelDiff : a.code.localeCompare(b.code)
}
