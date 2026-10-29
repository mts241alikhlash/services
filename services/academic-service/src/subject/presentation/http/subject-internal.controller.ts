import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
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
import { ISubjectRepository } from '../../domain/repositories/subject.repository.js'

export class SubjectSummaryDto {
  @ApiProperty() id!: string
  @ApiProperty() name!: string
  @ApiProperty({ nullable: true }) code!: string | null
}

export class SubjectSummaryListResponseDto {
  @ApiProperty({ type: [SubjectSummaryDto] })
  data!: SubjectSummaryDto[]
}

export class SubjectIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  ids!: string[]
}

@ApiTags('Subjects')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('subjects')
export class SubjectInternalController {
  constructor(private readonly subjectRepository: ISubjectRepository) {}

  @Post('by-ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Subjects for a batch of ids',
    description:
      'Labels rows that carry a subjectId. Ids that match nothing are absent ' +
      'from the response rather than returned as null.',
  })
  @ApiResponse({ status: 200, type: SubjectSummaryListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byIds(
    @Body() dto: SubjectIdsDto,
  ): Promise<SubjectSummaryListResponseDto> {
    const subjects = await this.subjectRepository.findManyByIds(dto.ids)
    return {
      data: subjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        code: subject.code ?? null,
      })),
    }
  }
}
