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
import { IAcademicYearRepository } from '../../domain/repositories/academic-year.repository.js'

export class AcademicYearSummaryDto {
  @ApiProperty() id!: string
  @ApiProperty() name!: string
}

export class AcademicYearIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  ids!: string[]
}

export class AcademicYearListResponseDto {
  @ApiProperty({ type: [AcademicYearSummaryDto] })
  data!: AcademicYearSummaryDto[]
}

export class AcademicYearSummaryResponseDto {
  @ApiProperty({ type: AcademicYearSummaryDto, nullable: true })
  data!: AcademicYearSummaryDto | null
}

@ApiTags('Academic Years')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('academic-years')
export class AcademicYearInternalController {
  constructor(
    private readonly academicYearRepository: IAcademicYearRepository,
  ) {}

  @Get('active')
  @ApiOperation({ summary: 'The academic year currently marked active' })
  @ApiResponse({ status: 200, type: AcademicYearSummaryResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async active(): Promise<AcademicYearSummaryResponseDto> {
    const year = await this.academicYearRepository.findActive()
    return { data: year ? { id: year.id, name: year.name } : null }
  }

  @Post('by-ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Academic years for a batch of ids' })
  @ApiResponse({ status: 200, type: AcademicYearListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byIds(
    @Body() dto: AcademicYearIdsDto,
  ): Promise<AcademicYearListResponseDto> {
    const years = await this.academicYearRepository.findManyByIds(dto.ids)
    return { data: years.map((year) => ({ id: year.id, name: year.name })) }
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Academic year name' })
  @ApiResponse({ status: 200, type: AcademicYearSummaryResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async summary(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AcademicYearSummaryResponseDto> {
    const year = await this.academicYearRepository.findById(id)
    return { data: year ? { id: year.id, name: year.name } : null }
  }
}
