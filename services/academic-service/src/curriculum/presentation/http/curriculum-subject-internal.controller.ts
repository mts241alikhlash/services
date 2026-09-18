import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common'
import {
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { ArrayMaxSize, IsArray, IsUUID, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { Public } from '../../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../../core/guards/provisioning-token.guard.js'
import { ICurriculumSubjectRepository } from '../../domain/repositories/curriculum-subject.repository.js'

export class PassingScoreQueryDto {
  @ApiProperty() @IsUUID() gradeId!: string
  @ApiProperty() @IsUUID() academicYearId!: string
  @ApiProperty() @IsUUID() subjectId!: string
}

export class BatchPassingScoreDto {
  @ApiProperty({ type: [PassingScoreQueryDto] })
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => PassingScoreQueryDto)
  queries!: PassingScoreQueryDto[]
}

export class ResolvedPassingScoreDto extends PassingScoreQueryDto {
  @ApiProperty() passingScore!: number
}

export class BatchPassingScoreResponseDto {
  @ApiProperty({ type: [ResolvedPassingScoreDto] })
  data!: ResolvedPassingScoreDto[]
}

@ApiTags('Curriculum Subjects')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('curriculum-subjects')
export class CurriculumSubjectInternalController {
  constructor(
    private readonly curriculumSubjectRepository: ICurriculumSubjectRepository,
  ) {}

  @Post('passing-scores')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve passing scores for a batch of grade/year/subject triples',
  })
  @ApiResponse({ status: 200, type: BatchPassingScoreResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async passingScores(
    @Body() dto: BatchPassingScoreDto,
  ): Promise<BatchPassingScoreResponseDto> {
    return {
      data: await this.curriculumSubjectRepository.findPassingScores(
        dto.queries,
      ),
    }
  }
}
