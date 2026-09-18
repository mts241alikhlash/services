import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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
import { IGradeRepository } from '../../domain/repositories/grade.repository.js'

export class GradeSummaryDto {
  @ApiProperty() id!: string
  @ApiProperty() level!: number
  @ApiProperty({ nullable: true }) name!: string | null
}

export class GradeSummaryResponseDto {
  @ApiProperty({ type: GradeSummaryDto, nullable: true })
  data!: GradeSummaryDto | null
}

export class GradeIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  ids!: string[]
}

export class GradeSummaryListResponseDto {
  @ApiProperty({ type: [GradeSummaryDto] })
  data!: GradeSummaryDto[]
}

export class GradeLevelsResponseDto {
  @ApiProperty({
    type: [Number],
    description: 'Active grade levels, ascending',
  })
  data!: number[]
}

@ApiTags('Grades')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('grades')
export class GradeInternalController {
  constructor(private readonly gradeRepository: IGradeRepository) {}

  @Get('levels')
  @ApiOperation({ summary: 'Active grade levels, for bulk-import validation' })
  @ApiResponse({ status: 200, type: GradeLevelsResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async levels(): Promise<GradeLevelsResponseDto> {
    const { data } = await this.gradeRepository.findAll({
      page: 1,
      limit: 200,
      isActive: true,
    })
    return {
      data: [...new Set(data.map((grade) => grade.level))].sort(
        (a, b) => a - b,
      ),
    }
  }

  @Post('by-ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Grades for a batch of ids',
    description:
      'Labels rows that carry a gradeId. Ids that match nothing are absent ' +
      'from the response rather than returned as null.',
  })
  @ApiResponse({ status: 200, type: GradeSummaryListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byIds(@Body() dto: GradeIdsDto): Promise<GradeSummaryListResponseDto> {
    const grades = await this.gradeRepository.findManyByIds(dto.ids)
    return {
      data: grades.map((grade) => ({
        id: grade.id,
        level: grade.level,
        name: grade.name ?? null,
      })),
    }
  }

  @Get('by-level/:level')
  @ApiOperation({ summary: 'Resolve a grade by its level' })
  @ApiResponse({ status: 200, type: GradeSummaryResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byLevel(
    @Param('level', ParseIntPipe) level: number,
  ): Promise<GradeSummaryResponseDto> {
    const grade = await this.gradeRepository.findByLevel(level)
    return {
      data: grade
        ? { id: grade.id, level: grade.level, name: grade.name ?? null }
        : null,
    }
  }
}
