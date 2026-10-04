import {
  Body,
  Controller,
  Get,
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
import { Public } from '../../../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../../../user/guards/provisioning-token.guard.js'
import { IReligionRepository } from '../../domain/repositories/religion.repository.js'

export class ReligionSummaryDto {
  @ApiProperty() id!: string
  @ApiProperty() name!: string
  @ApiProperty() isActive!: boolean
}

export class ReligionIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  ids!: string[]
}

export class ReligionSummaryListResponseDto {
  @ApiProperty({ type: [ReligionSummaryDto] })
  data!: ReligionSummaryDto[]
}

@ApiTags('Religions')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('religions')
export class ReligionInternalController {
  constructor(private readonly repository: IReligionRepository) {}

  @Get('active')
  @ApiOperation({
    summary: 'Active religions',
    description: 'The choices another service offers on its own forms.',
  })
  @ApiResponse({ status: 200, type: ReligionSummaryListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async active(): Promise<ReligionSummaryListResponseDto> {
    const { data } = await this.repository.findAll({
      page: 1,
      limit: 100,
      isActive: true,
    })
    return {
      data: data.map((row) => ({
        id: row.id,
        name: row.name,
        isActive: row.isActive,
      })),
    }
  }

  @Post('by-ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Religions for a batch of ids',
    description:
      'Ids that match nothing are absent from the response rather than ' +
      'returned as null.',
  })
  @ApiResponse({ status: 200, type: ReligionSummaryListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byIds(
    @Body() dto: ReligionIdsDto,
  ): Promise<ReligionSummaryListResponseDto> {
    const rows = await this.repository.findManyByIds(dto.ids)
    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        isActive: row.isActive,
      })),
    }
  }
}
