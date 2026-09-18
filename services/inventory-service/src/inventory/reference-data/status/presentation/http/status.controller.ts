import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../../../platform/auth/index.js'
import { RequirePermissions } from '../../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { GetStatusesUseCase } from '../../application/use-cases/get-statuses/get-statuses.use-case.js'
import { CreateStatusUseCase } from '../../application/use-cases/create-status/create-status.use-case.js'
import { UpdateStatusUseCase } from '../../application/use-cases/update-status/update-status.use-case.js'
import { DeleteStatusUseCase } from '../../application/use-cases/delete-status/delete-status.use-case.js'
import { CreateStatusDto } from './dto/request/create-status.dto.js'
import { UpdateStatusDto } from './dto/request/update-status.dto.js'
import { InventoryStatusResponseDto } from './dto/response/status-response.dto.js'

@ApiTags('Inventory Statuses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory/statuses')
export class StatusController {
  constructor(
    private readonly getStatusesUseCase: GetStatusesUseCase,
    private readonly createStatusUseCase: CreateStatusUseCase,
    private readonly updateStatusUseCase: UpdateStatusUseCase,
    private readonly deleteStatusUseCase: DeleteStatusUseCase,
  ) {}

  @Get()
  @ApiQuery({ name: 'search', required: false })
  @RequirePermissions('inventory-reference-data.read')
  @ApiOperation({ summary: 'Get status list' })
  @ApiResponse({ status: 200, type: [InventoryStatusResponseDto] })
  async getStatuses(@Query('search') search?: string) {
    return this.getStatusesUseCase.execute(search)
  }

  @Post()
  @RequirePermissions('inventory-reference-data.create')
  @ApiOperation({ summary: 'Create status item' })
  @ApiResponse({ status: 201, type: InventoryStatusResponseDto })
  async createStatus(@Body() data: CreateStatusDto) {
    return this.createStatusUseCase.execute(data)
  }

  @Patch(':id')
  @RequirePermissions('inventory-reference-data.update')
  @ApiOperation({ summary: 'Update status item' })
  @ApiResponse({ status: 200, type: InventoryStatusResponseDto })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateStatusDto,
  ) {
    return this.updateStatusUseCase.execute(id, data)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('inventory-reference-data.delete')
  @ApiOperation({ summary: 'Delete status item' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteStatus(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteStatusUseCase.execute(id)
  }
}
