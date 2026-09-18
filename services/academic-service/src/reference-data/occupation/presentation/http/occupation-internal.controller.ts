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
import { IOccupationRepository } from '../../domain/repositories/occupation.repository.js'

export class OccupationSummaryDto {
  @ApiProperty() id!: string
  @ApiProperty() name!: string

  @ApiProperty({
    description:
      'Callers refuse to assign an inactive occupation, so it travels with ' +
      'the name rather than being assumed true.',
  })
  isActive!: boolean
}

export class OccupationIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  ids!: string[]
}

export class OccupationSummaryListResponseDto {
  @ApiProperty({ type: [OccupationSummaryDto] })
  data!: OccupationSummaryDto[]
}

export class OccupationSummaryResponseDto {
  @ApiProperty({ type: OccupationSummaryDto, nullable: true })
  data!: OccupationSummaryDto | null
}

@ApiTags('Occupations')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('occupations')
export class OccupationInternalController {
  constructor(private readonly occupationRepository: IOccupationRepository) {}

  @Get(':id/summary')
  @ApiOperation({ summary: 'Occupation name' })
  @ApiResponse({ status: 200, type: OccupationSummaryResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async summary(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OccupationSummaryResponseDto> {
    const occupation = await this.occupationRepository.findById(id)
    return { data: occupation ? toSummary(occupation) : null }
  }

  @Post('by-ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Occupations for a batch of ids' })
  @ApiResponse({ status: 200, type: OccupationSummaryListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byIds(
    @Body() dto: OccupationIdsDto,
  ): Promise<OccupationSummaryListResponseDto> {
    const occupations = await this.occupationRepository.findManyByIds(dto.ids)
    return { data: occupations.map(toSummary) }
  }
}

function toSummary(occupation: {
  id: string
  name: string
  isActive: boolean
}): OccupationSummaryDto {
  return {
    id: occupation.id,
    name: occupation.name,
    isActive: occupation.isActive,
  }
}
