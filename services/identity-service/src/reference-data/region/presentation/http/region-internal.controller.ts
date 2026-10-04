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
import { ArrayMaxSize, IsArray, Matches } from 'class-validator'
import { Public } from '../../../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../../../user/guards/provisioning-token.guard.js'
import { IRegionRepository } from '../../domain/repositories/region.repository.js'
import {
  RegionNodeListResponseDto,
  RegionNodeResponseDto,
} from './dto/response/region-api-response.dto.js'

export class RegionCodesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(50)
  @Matches(/^\d{2}(\.\d{2}(\.\d{2}(\.\d{4})?)?)?$/, { each: true })
  codes!: string[]
}

@ApiTags('Regions')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('regions')
export class RegionInternalController {
  constructor(private readonly regions: IRegionRepository) {}

  @Post('by-codes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regions for a batch of codes' })
  @ApiResponse({ status: 200, type: RegionNodeListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byCodes(
    @Body() dto: RegionCodesDto,
  ): Promise<RegionNodeListResponseDto> {
    const rows = await this.regions.findByCodes(dto.codes)
    return { data: rows.map((row) => RegionNodeResponseDto.fromDomain(row)) }
  }
}
