import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '../../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../../user/guards/provisioning-token.guard.js'
import { ISchoolUnitRepository } from '../../domain/repositories/school-unit.repository.js'
import { SchoolUnitProfileResponseDto } from './dto/response/school-unit-profile-response.dto.js'

@ApiTags('School Unit')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('school-units')
export class SchoolUnitProfileController {
  constructor(private readonly schoolUnitRepository: ISchoolUnitRepository) {}

  @Get('profile')
  @ApiOperation({ summary: "Resolve the school unit's own profile" })
  @ApiResponse({ status: 200, type: SchoolUnitProfileResponseDto })
  async profile(): Promise<SchoolUnitProfileResponseDto | null> {
    const schoolUnit = await this.schoolUnitRepository.findFirst()
    return schoolUnit
      ? {
          name: schoolUnit.name,
          email: schoolUnit.email ?? null,
          phone: schoolUnit.phone ?? null,
        }
      : null
  }
}
