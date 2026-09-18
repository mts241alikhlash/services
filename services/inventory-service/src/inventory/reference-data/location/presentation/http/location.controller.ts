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
import { GetLocationsUseCase } from '../../application/use-cases/get-locations/get-locations.use-case.js'
import { CreateLocationUseCase } from '../../application/use-cases/create-location/create-location.use-case.js'
import { UpdateLocationUseCase } from '../../application/use-cases/update-location/update-location.use-case.js'
import { DeleteLocationUseCase } from '../../application/use-cases/delete-location/delete-location.use-case.js'
import { CreateLocationDto } from './dto/request/create-location.dto.js'
import { UpdateLocationDto } from './dto/request/update-location.dto.js'
import { InventoryLocationResponseDto } from './dto/response/location-response.dto.js'

@ApiTags('Inventory Locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory/locations')
export class LocationController {
  constructor(
    private readonly getLocationsUseCase: GetLocationsUseCase,
    private readonly createLocationUseCase: CreateLocationUseCase,
    private readonly updateLocationUseCase: UpdateLocationUseCase,
    private readonly deleteLocationUseCase: DeleteLocationUseCase,
  ) {}

  @Get()
  @ApiQuery({ name: 'search', required: false })
  @RequirePermissions('inventory-reference-data.read')
  @ApiOperation({ summary: 'Get location list' })
  @ApiResponse({ status: 200, type: [InventoryLocationResponseDto] })
  async getLocations(@Query('search') search?: string) {
    return this.getLocationsUseCase.execute(search)
  }

  @Post()
  @RequirePermissions('inventory-reference-data.create')
  @ApiOperation({ summary: 'Create location item' })
  @ApiResponse({ status: 201, type: InventoryLocationResponseDto })
  async createLocation(@Body() data: CreateLocationDto) {
    return this.createLocationUseCase.execute(data)
  }

  @Patch(':id')
  @RequirePermissions('inventory-reference-data.update')
  @ApiOperation({ summary: 'Update location item' })
  @ApiResponse({ status: 200, type: InventoryLocationResponseDto })
  async updateLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateLocationDto,
  ) {
    return this.updateLocationUseCase.execute(id, data)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('inventory-reference-data.delete')
  @ApiOperation({ summary: 'Delete location item' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteLocation(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteLocationUseCase.execute(id)
  }
}
