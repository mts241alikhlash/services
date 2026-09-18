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
import { Public } from '../../../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../../../core/guards/provisioning-token.guard.js'
import { IEducationRepository } from '../../domain/repositories/education.repository.js'

export class EducationSummaryDto {
  @ApiProperty() id!: string
  @ApiProperty() name!: string
  @ApiProperty() isActive!: boolean
}

export class EducationIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  ids!: string[]
}

export class EducationSummaryResponseDto {
  @ApiProperty({ type: EducationSummaryDto, nullable: true })
  data!: EducationSummaryDto | null
}

export class EducationSummaryListResponseDto {
  @ApiProperty({ type: [EducationSummaryDto] })
  data!: EducationSummaryDto[]
}

@ApiTags('Educations')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('educations')
export class EducationInternalController {
  constructor(private readonly educationRepository: IEducationRepository) {}

  @Post('by-ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Education levels for a batch of ids',
    description:
      'Ids that match nothing are absent from the response rather than ' +
      'returned as null.',
  })
  @ApiResponse({ status: 200, type: EducationSummaryListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byIds(
    @Body() dto: EducationIdsDto,
  ): Promise<EducationSummaryListResponseDto> {
    const rows = await this.educationRepository.findManyByIds(dto.ids)
    return { data: rows.map(toSummary) }
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'One education level' })
  @ApiResponse({ status: 200, type: EducationSummaryResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async summary(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EducationSummaryResponseDto> {
    const education = await this.educationRepository.findById(id)
    return { data: education ? toSummary(education) : null }
  }
}

function toSummary(education: {
  id: string
  name: string
  isActive: boolean
}): EducationSummaryDto {
  return {
    id: education.id,
    name: education.name,
    isActive: education.isActive,
  }
}
