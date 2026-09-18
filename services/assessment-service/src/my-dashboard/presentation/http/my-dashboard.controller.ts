import { Controller, Get, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../platform/auth/index.js'
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js'
import type { AuthenticatedUser } from '../../../core/types/authenticated-user.type.js'
import { MyDashboardResponseDto } from './dto/response/my-dashboard-response.dto.js'
import { GetMyDashboardUseCase } from '../../application/use-cases/get-my-dashboard/get-my-dashboard.use-case.js'

@ApiTags('Dashboards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboards')
export class MyDashboardController {
  constructor(private readonly getMyDashboard: GetMyDashboardUseCase) {}

  @Get('me')
  @RequirePermissions('dashboards.read-own')
  @ApiOperation({
    summary: 'Your own dashboard — as a student, an employee, or both',
  })
  @ApiResponse({ status: 200, type: MyDashboardResponseDto })
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.getMyDashboard.execute(user.id)
  }
}
