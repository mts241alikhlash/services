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
import { Public } from '../../../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../../../user/guards/provisioning-token.guard.js'
import { IBloodTypeRepository } from '../../domain/repositories/blood-type.repository.js'

export class BloodTypeSummaryDto {
  @ApiProperty() id!: string
  @ApiProperty() name!: string
  @ApiProperty() isActive!: boolean
}

export class BloodTypeIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  ids!: string[]
}

export class BloodTypeSummaryListResponseDto {
  @ApiProperty({ type: [BloodTypeSummaryDto] })
  data!: BloodTypeSummaryDto[]
}

@ApiTags('BloodTypes')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('blood-types')
export class BloodTypeInternalController {
  constructor(private readonly repository: IBloodTypeRepository) {}

  @Post('by-ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'BloodTypes for a batch of ids',
    description:
      'Ids that match nothing are absent from the response rather than ' +
      'returned as null.',
  })
  @ApiResponse({ status: 200, type: BloodTypeSummaryListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byIds(
    @Body() dto: BloodTypeIdsDto,
  ): Promise<BloodTypeSummaryListResponseDto> {
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
