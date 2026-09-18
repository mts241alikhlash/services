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
import { ProvisioningTokenGuard } from '../../../core/guards/provisioning-token.guard.js'
import { ITeachingAssignmentRepository } from '../../domain/repositories/teaching-assignment.repository.js'

export class TeachingAssignmentExistsResponseDto {
  @ApiProperty({ description: 'false when missing or soft-deleted' })
  data!: { exists: boolean }
}

export class TeachingAssignmentIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('4', { each: true })
  ids!: string[]
}

export class TeachingAssignmentDetailDto {
  @ApiProperty() id!: string
  @ApiProperty() employeeId!: string
  @ApiProperty() classroomId!: string
  @ApiProperty() subjectId!: string
  @ApiProperty() semesterId!: string
  @ApiProperty({ nullable: true }) subjectCode!: string | null
  @ApiProperty() subjectName!: string
  @ApiProperty() classroomCode!: string
  @ApiProperty({ nullable: true }) classroomName!: string | null
  @ApiProperty() classroomGradeId!: string
  @ApiProperty() classroomAcademicYearId!: string

  @ApiProperty({
    nullable: true,
    description:
      "This assignment's own passing mark, when it overrides the curriculum's.",
  })
  passingScore!: number | null

  @ApiProperty({
    nullable: true,
    description:
      "The employee's identity account, so the caller resolves the name " +
      'through identity-service rather than through this service. Null when ' +
      'hr-service no longer has that employee.',
  })
  employeeUserId!: string | null
}

export class TeachingAssignmentDetailListResponseDto {
  @ApiProperty({ type: [TeachingAssignmentDetailDto] })
  data!: TeachingAssignmentDetailDto[]
}

export class EmployeeIdListResponseDto {
  @ApiProperty({ type: [String] })
  data!: string[]
}

export class TeachingLoadDto {
  @ApiProperty() classroomCount!: number
  @ApiProperty() subjectCount!: number
}

export class TeachingLoadResponseDto {
  @ApiProperty({ type: TeachingLoadDto })
  data!: TeachingLoadDto
}

@ApiTags('Teaching Assignments')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('teaching-assignments')
export class TeachingAssignmentInternalController {
  constructor(
    private readonly teachingAssignmentRepository: ITeachingAssignmentRepository,
  ) {}

  @Post('by-ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Teaching assignments for a batch of ids',
    description:
      'Every assessment item, score and attendance record in ' +
      'assessment-service hangs off one of these and is rendered with its ' +
      'subject, classroom and employee. Ids that match nothing are absent ' +
      'from the response rather than returned as null.',
  })
  @ApiResponse({ status: 200, type: TeachingAssignmentDetailListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byIds(
    @Body() dto: TeachingAssignmentIdsDto,
  ): Promise<TeachingAssignmentDetailListResponseDto> {
    return {
      data: await this.teachingAssignmentRepository.findDetailsByIds(dto.ids),
    }
  }

  @Get('by-employee')
  @ApiOperation({
    summary: "An employee's assignments for one term",
    description:
      'Answers "which classes and subjects am I responsible for", which ' +
      'assessment-service asks before listing the marking still outstanding.',
  })
  @ApiResponse({ status: 200, type: TeachingAssignmentDetailListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byEmployee(
    @Query('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('semesterId', ParseUUIDPipe) semesterId: string,
  ): Promise<TeachingAssignmentDetailListResponseDto> {
    return {
      data: await this.teachingAssignmentRepository.findDetailsByEmployee(
        employeeId,
        semesterId,
      ),
    }
  }

  @Get('employee-ids')
  @ApiOperation({
    summary: 'Employees who taught or supervised in one academic year',
    description:
      'hr-service filters its own roster by this. Ids alone: which ' +
      'employees those are is its question, not this one.',
  })
  @ApiResponse({ status: 200, type: EmployeeIdListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async employeeIds(
    @Query('academicYearId', ParseUUIDPipe) academicYearId: string,
  ): Promise<EmployeeIdListResponseDto> {
    return {
      data: await this.teachingAssignmentRepository.listEmployeeIdsForAcademicYear(
        academicYearId,
      ),
    }
  }

  @Get('load')
  @ApiOperation({
    summary: 'How many classrooms and subjects an employee carries in a term',
  })
  @ApiResponse({ status: 200, type: TeachingLoadResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async load(
    @Query('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('semesterId', ParseUUIDPipe) semesterId: string,
  ): Promise<TeachingLoadResponseDto> {
    return {
      data: await this.teachingAssignmentRepository.summariseLoad(
        employeeId,
        semesterId,
      ),
    }
  }

  @Get(':id/exists')
  @ApiOperation({
    summary: 'Whether a teaching assignment exists and is live',
    description:
      'With `employeeId`, also asserts the assignment belongs to that employee — ' +
      'which is how assessment-service decides whether an employee may grade ' +
      'an assessment item without holding a copy of this table.',
  })
  @ApiResponse({ status: 200, type: TeachingAssignmentExistsResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async exists(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('employeeId') employeeId?: string,
  ): Promise<TeachingAssignmentExistsResponseDto> {
    if (employeeId) {
      return {
        data: {
          exists: await this.teachingAssignmentRepository.existsForEmployee(
            id,
            employeeId,
          ),
        },
      }
    }

    const assignment = await this.teachingAssignmentRepository.findById(id)
    return { data: { exists: assignment !== null } }
  }
}
