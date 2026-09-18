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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../../../platform/auth/index.js'
import { RequirePermissions } from '../../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { GetConditionsUseCase } from '../../application/use-cases/get-conditions/get-conditions.use-case.js'
import { CreateConditionUseCase } from '../../application/use-cases/create-condition/create-condition.use-case.js'
import { UpdateConditionUseCase } from '../../application/use-cases/update-condition/update-condition.use-case.js'
import { DeleteConditionUseCase } from '../../application/use-cases/delete-condition/delete-condition.use-case.js'
import { CreateConditionDto } from './dto/request/create-condition.dto.js'
import { UpdateConditionDto } from './dto/request/update-condition.dto.js'
import { InventoryConditionResponseDto } from './dto/response/condition-response.dto.js'

@ApiTags('Inventory Conditions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory/conditions')
export class ConditionController {
  constructor(
    private readonly getConditionsUseCase: GetConditionsUseCase,
    private readonly createConditionUseCase: CreateConditionUseCase,
    private readonly updateConditionUseCase: UpdateConditionUseCase,
    private readonly deleteConditionUseCase: DeleteConditionUseCase,
  ) {}

  @Get()
  @RequirePermissions('inventory-reference-data.read')
  @ApiOperation({ summary: 'Get condition list' })
  @ApiResponse({ status: 200, type: [InventoryConditionResponseDto] })
  async getConditions(@Query('search') search?: string) {
    return this.getConditionsUseCase.execute(search)
  }

  @Post()
  @RequirePermissions('inventory-reference-data.create')
  @ApiOperation({ summary: 'Create condition item' })
  @ApiResponse({ status: 201, type: InventoryConditionResponseDto })
  async createCondition(@Body() data: CreateConditionDto) {
    return this.createConditionUseCase.execute(data)
  }

  @Patch(':id')
  @RequirePermissions('inventory-reference-data.update')
  @ApiOperation({ summary: 'Update condition item' })
  @ApiResponse({ status: 200, type: InventoryConditionResponseDto })
  async updateCondition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateConditionDto,
  ) {
    return this.updateConditionUseCase.execute(id, data)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('inventory-reference-data.delete')
  @ApiOperation({ summary: 'Delete condition item' })
  async deleteCondition(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteConditionUseCase.execute(id)
  }
}
