import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../../auth/index.js'
import { IRegionRepository } from '../../domain/repositories/region.repository.js'
import { RegionListResponseDto } from './dto/response/region-response.dto.js'

@ApiTags('Regions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('regions')
export class RegionController {
  constructor(private readonly regions: IRegionRepository) {}

  @Get('provinces')
  @ApiOperation({
    summary: 'Every province, the first step of an address',
    description:
      'No permission is required: this is a picker on a form anyone signed in may fill in.',
  })
  @ApiResponse({ status: 200, type: RegionListResponseDto })
  async provinces() {
    return this.regions.findProvinces()
  }

  @Get(':code/children')
  @ApiOperation({
    summary: 'The areas one level below a code',
    description:
      'The whole cascade runs through this one route: a province code returns regencies, a regency code returns districts, a district code returns villages.',
  })
  @ApiParam({ name: 'code', example: '32.04' })
  @ApiResponse({ status: 200, type: RegionListResponseDto })
  async children(@Param('code') code: string) {
    return this.regions.findChildren(code)
  }
}
