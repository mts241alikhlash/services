import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '../../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../guards/provisioning-token.guard.js'
import { BatchProfileLookupDto } from './dto/request/batch-profile-lookup.dto.js'
import { BatchProfileLookupResponseDto } from './dto/response/profile-summary-response.dto.js'
import { GetProfilesByIdsUseCase } from '../../application/use-cases/get-profiles-by-ids/get-profiles-by-ids.use-case.js'

@ApiTags('Profiles')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(
    private readonly getProfilesByIdsUseCase: GetProfilesByIdsUseCase,
  ) {}

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve the profile behind a batch of user ids',
  })
  @ApiResponse({ status: 200, type: BatchProfileLookupResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async batch(
    @Body() dto: BatchProfileLookupDto,
  ): Promise<BatchProfileLookupResponseDto> {
    const data = await this.getProfilesByIdsUseCase.execute(dto.userIds)
    return { data }
  }
}
