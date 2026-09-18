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
import { GetFundingSourcesUseCase } from '../../application/use-cases/get-funding-sources/get-funding-sources.use-case.js'
import { CreateFundingSourceUseCase } from '../../application/use-cases/create-funding-source/create-funding-source.use-case.js'
import { UpdateFundingSourceUseCase } from '../../application/use-cases/update-funding-source/update-funding-source.use-case.js'
import { DeleteFundingSourceUseCase } from '../../application/use-cases/delete-funding-source/delete-funding-source.use-case.js'
import { CreateFundingSourceDto } from './dto/request/create-funding-source.dto.js'
import { UpdateFundingSourceDto } from './dto/request/update-funding-source.dto.js'
import { InventoryFundingSourceResponseDto } from './dto/response/funding-source-response.dto.js'

@ApiTags('Inventory Funding Sources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory/funding-sources')
export class FundingSourceController {
  constructor(
    private readonly getFundingSourcesUseCase: GetFundingSourcesUseCase,
    private readonly createFundingSourceUseCase: CreateFundingSourceUseCase,
    private readonly updateFundingSourceUseCase: UpdateFundingSourceUseCase,
    private readonly deleteFundingSourceUseCase: DeleteFundingSourceUseCase,
  ) {}

  @Get()
  @ApiQuery({ name: 'search', required: false })
  @RequirePermissions('inventory-reference-data.read')
  @ApiOperation({ summary: 'Get funding source list' })
  @ApiResponse({ status: 200, type: [InventoryFundingSourceResponseDto] })
  async getFundingSources(@Query('search') search?: string) {
    return this.getFundingSourcesUseCase.execute(search)
  }

  @Post()
  @RequirePermissions('inventory-reference-data.create')
  @ApiOperation({ summary: 'Create funding source item' })
  @ApiResponse({ status: 201, type: InventoryFundingSourceResponseDto })
  async createFundingSource(@Body() data: CreateFundingSourceDto) {
    return this.createFundingSourceUseCase.execute(data)
  }

  @Patch(':id')
  @RequirePermissions('inventory-reference-data.update')
  @ApiOperation({ summary: 'Update funding source item' })
  @ApiResponse({ status: 200, type: InventoryFundingSourceResponseDto })
  async updateFundingSource(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateFundingSourceDto,
  ) {
    return this.updateFundingSourceUseCase.execute(id, data)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('inventory-reference-data.delete')
  @ApiOperation({ summary: 'Delete funding source item' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteFundingSource(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteFundingSourceUseCase.execute(id)
  }
}
