import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../platform/auth/index.js'
import { ListAbsenteesUseCase } from '../../application/use-cases/list-absentees/list-absentees.use-case.js'
import { AbsenteeDto } from './dto/response/absentee-response.dto.js'

@ApiTags('Exam Makeups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exam-schedules')
export class ExamMakeupController {
  constructor(private readonly listAbsentees: ListAbsenteesUseCase) {}

  @Get(':id/absentees')
  @RequirePermissions('exam-schedules.read')
  @ApiOperation({
    summary: 'The students of the classroom who can still sit a makeup',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: [AbsenteeDto] })
  async absentees(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AbsenteeDto[]> {
    return (await this.listAbsentees.execute(id)).map((row) =>
      AbsenteeDto.fromDomain(row),
    )
  }
}
