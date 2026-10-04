import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
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
import { ISemesterRepository } from '../../domain/repositories/semester.repository.js'

export class SemesterSummaryDto {
  @ApiProperty() id!: string
  @ApiProperty({ nullable: true }) typeName!: string | null
  @ApiProperty({ nullable: true }) academicYearName!: string | null
}

export class SemesterContextDto {
  @ApiProperty() id!: string
  @ApiProperty() academicYearId!: string
  @ApiProperty({ nullable: true }) academicYearName!: string | null
  @ApiProperty({ nullable: true }) typeId!: string | null
  @ApiProperty({ nullable: true }) typeName!: string | null
  @ApiProperty() isActive!: boolean

  @ApiProperty({
    description:
      'Term order within the year. Callers pick the first or last term by ' +
      'this rather than by relying on the response order.',
  })
  sequence!: number
}

export class SemesterIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('4', { each: true })
  ids!: string[]
}

export class SemesterContextListResponseDto {
  @ApiProperty({ type: [SemesterContextDto] })
  data!: SemesterContextDto[]
}

export class SemesterContextResponseDto {
  @ApiProperty({ type: SemesterContextDto, nullable: true })
  data!: SemesterContextDto | null
}

export class SemesterSummaryResponseDto {
  @ApiProperty({ type: SemesterSummaryDto, nullable: true })
  data!: SemesterSummaryDto | null
}

@ApiTags('Semesters')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('semesters')
export class SemesterInternalController {
  constructor(private readonly semesterRepository: ISemesterRepository) {}

  @Get('active')
  @ApiOperation({ summary: 'The semester currently marked active' })
  @ApiResponse({ status: 200, type: SemesterContextResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async active(): Promise<SemesterContextResponseDto> {
    const semester = await this.semesterRepository.findActive()
    return { data: semester ? toContext(semester) : null }
  }

  @Post('by-ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Semesters for a batch of ids',
    description:
      'Labels rows that reference a term by id. Ids that match nothing are ' +
      'absent from the response rather than returned as null.',
  })
  @ApiResponse({ status: 200, type: SemesterContextListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byIds(
    @Body() dto: SemesterIdsDto,
  ): Promise<SemesterContextListResponseDto> {
    const semesters = await this.semesterRepository.findManyByIds(dto.ids)
    return { data: semesters.map(toContext) }
  }

  @Get('by-academic-year/:academicYearId')
  @ApiOperation({
    summary: "An academic year's semesters, last term first",
  })
  @ApiResponse({ status: 200, type: SemesterContextListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byAcademicYear(
    @Param('academicYearId', ParseUUIDPipe) academicYearId: string,
  ): Promise<SemesterContextListResponseDto> {
    const { data } = await this.semesterRepository.findAll({
      page: 1,
      limit: 50,
      academicYearId,
    })
    return {
      data: data.map(toContext).sort((a, b) => b.sequence - a.sequence),
    }
  }

  @Get(':id/context')
  @ApiOperation({ summary: 'Semester with its academic year' })
  @ApiResponse({ status: 200, type: SemesterContextResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async context(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SemesterContextResponseDto> {
    const semester = await this.semesterRepository.findById(id)
    return { data: semester ? toContext(semester) : null }
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Semester type and academic year' })
  @ApiResponse({ status: 200, type: SemesterSummaryResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async summary(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SemesterSummaryResponseDto> {
    const semester = await this.semesterRepository.findById(id)
    if (!semester) return { data: null }
    return {
      data: {
        id: semester.id,
        typeName: semester.type?.name ?? null,
        academicYearName: semester.academicYear?.name ?? null,
      },
    }
  }
}

function toContext(semester: {
  id: string
  academicYearId: string
  isActive?: boolean
  academicYear?: { name?: string | null } | null
  type?: {
    id?: string | null
    name?: string | null
    sequence?: number | null
  } | null
}): SemesterContextDto {
  return {
    id: semester.id,
    academicYearId: semester.academicYearId,
    academicYearName: semester.academicYear?.name ?? null,
    typeId: semester.type?.id ?? null,
    typeName: semester.type?.name ?? null,
    isActive: semester.isActive ?? false,
    sequence: semester.type?.sequence ?? 0,
  }
}
