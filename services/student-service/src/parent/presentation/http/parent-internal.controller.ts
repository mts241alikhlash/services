import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common'
import {
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Public } from '../../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../../core/guards/provisioning-token.guard.js'
import { IParentRepository } from '../../domain/repositories/parent.repository.js'

export class ParentOccupationCountResponseDto {
  @ApiProperty({
    description: 'Live parents naming this occupation. Soft-deleted excluded.',
    example: 3,
  })
  data!: { count: number }
}

@ApiTags('Parents')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('parents')
export class ParentInternalController {
  constructor(private readonly parentRepository: IParentRepository) {}

  @Get('count-by-occupation/:occupationId')
  @ApiOperation({ summary: 'Count live parents naming an occupation' })
  @ApiResponse({ status: 200, type: ParentOccupationCountResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async countByOccupation(
    @Param('occupationId', ParseUUIDPipe) occupationId: string,
  ): Promise<ParentOccupationCountResponseDto> {
    return {
      data: {
        count: await this.parentRepository.countByOccupation(occupationId),
      },
    }
  }
}
