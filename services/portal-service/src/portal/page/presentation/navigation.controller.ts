import { NavItemResponseDto } from '../dto/response/page-api-response.dto.js'
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
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import {
  CreateNavItemDto,
  ReorderNavDto,
  UpdateNavItemDto,
} from '../dto/request/page.dto.js'
import {
  CreateNavItemUseCase,
  DeleteNavItemUseCase,
  GetNavigationUseCase,
  ReorderNavigationUseCase,
  UpdateNavItemUseCase,
} from '../use-cases/manage-navigation.use-cases.js'

@ApiTags('Portal — Content')
@ApiBearerAuth()
@Controller('portal/navigation')
export class NavigationController {
  constructor(
    private readonly getNavigationUseCase: GetNavigationUseCase,
    private readonly createNavItemUseCase: CreateNavItemUseCase,
    private readonly updateNavItemUseCase: UpdateNavItemUseCase,
    private readonly reorderNavigationUseCase: ReorderNavigationUseCase,
    private readonly deleteNavItemUseCase: DeleteNavItemUseCase,
  ) {}

  @Get()
  @RequirePermissions('portal-pages.read')
  @ApiOperation({ summary: 'The public menu as configured, including hidden' })
  async findAll(): Promise<NavItemResponseDto[]> {
    return (await this.getNavigationUseCase.execute()).map((item) =>
      NavItemResponseDto.fromDomain(item),
    )
  }

  @Post()
  @RequirePermissions('portal-pages.update')
  @ApiResponse({
    status: 400,
    description: 'Zero or more than one destination set',
  })
  async create(@Body() dto: CreateNavItemDto): Promise<NavItemResponseDto> {
    return NavItemResponseDto.fromDomain(
      await this.createNavItemUseCase.execute(dto),
    )
  }

  @Patch('order')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('portal-pages.update')
  @ApiOperation({ summary: 'Reorder — position is the array index (FR-053)' })
  async reorder(@Body() dto: ReorderNavDto): Promise<void> {
    await this.reorderNavigationUseCase.execute(dto)
  }

  @Patch(':id')
  @RequirePermissions('portal-pages.update')
  @ApiParam({ name: 'id', format: 'uuid' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNavItemDto,
  ): Promise<NavItemResponseDto> {
    return NavItemResponseDto.fromDomain(
      await this.updateNavItemUseCase.execute(id, dto),
    )
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('portal-pages.update')
  @ApiParam({ name: 'id', format: 'uuid' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteNavItemUseCase.execute(id)
  }
}
