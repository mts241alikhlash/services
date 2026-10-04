import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  type Type,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiResponse,
  ApiTags,
  PartialType,
} from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator'
import { Public } from '../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../core/guards/provisioning-token.guard.js'
import { RequirePermissions } from '../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../platform/auth/index.js'
import { PaginationQueryDto } from '../../shared/dto/pagination.dto.js'
import { toBooleanFromTransform } from '../../shared/validators/boolean.transformer.js'
import type { SimpleListService } from './simple-list.service.js'
import type {
  SimpleListDefinition,
  SimpleListItem,
} from './simple-list.types.js'

function named<T extends Type>(type: T, name: string): T {
  Object.defineProperty(type, 'name', { value: name })
  return type
}

export function createSimpleListControllers(
  definition: SimpleListDefinition,
  serviceToken: string,
): { controller: Type; internalController: Type } {
  const { className, label, path, permission, tag } = definition

  class ItemResponseDto {
    @ApiProperty({ type: String })
    id!: string

    @ApiProperty({ type: String })
    name!: string

    @ApiProperty({ type: Number })
    sortOrder!: number

    @ApiProperty({ type: Boolean })
    isActive!: boolean

    static fromDomain(domain: SimpleListItem): ItemResponseDto {
      const dto = new ItemResponseDto()
      dto.id = domain.id
      dto.name = domain.name
      dto.sortOrder = domain.sortOrder
      dto.isActive = domain.isActive
      return dto
    }
  }

  class PageResponseMetaDto {
    @ApiProperty({ type: Number })
    page!: number

    @ApiProperty({ type: Number })
    limit!: number

    @ApiProperty({ type: Number })
    total!: number

    @ApiProperty({ type: Number })
    totalPages!: number
  }

  class PageResponseDto {
    @ApiProperty({ type: () => [ItemResponseDto] })
    data!: ItemResponseDto[]

    @ApiProperty({ type: () => PageResponseMetaDto })
    meta!: PageResponseMetaDto

    static fromDomain(
      domain: Awaited<ReturnType<SimpleListService['list']>>,
    ): PageResponseDto {
      const dto = new PageResponseDto()
      dto.data = domain.data.map((item) => ItemResponseDto.fromDomain(item))
      dto.meta = Object.assign(new PageResponseMetaDto(), domain.meta)
      return dto
    }
  }

  class SummaryDto {
    @ApiProperty({ type: String })
    id!: string

    @ApiProperty({ type: String })
    name!: string

    @ApiProperty({ type: Boolean })
    isActive!: boolean

    static fromDomain(domain: SimpleListItem): SummaryDto {
      const dto = new SummaryDto()
      dto.id = domain.id
      dto.name = domain.name
      dto.isActive = domain.isActive && !domain.deletedAt
      return dto
    }
  }

  class SummaryResponseDto {
    @ApiProperty({ type: () => SummaryDto, nullable: true })
    data!: SummaryDto | null
  }

  class SummaryListResponseDto {
    @ApiProperty({ type: () => [SummaryDto] })
    data!: SummaryDto[]
  }

  class CreateDto {
    @ApiProperty({ example: label })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name!: string

    @ApiPropertyOptional({ example: 0, default: 0, minimum: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number

    @ApiPropertyOptional({ example: true, default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean
  }

  class UpdateDto extends PartialType(CreateDto) {}

  class QueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({ description: 'Search by name' })
    @IsOptional()
    @IsString()
    search?: string

    @ApiPropertyOptional({ description: 'Filter by active status' })
    @IsOptional()
    @Transform(toBooleanFromTransform)
    @IsBoolean()
    isActive?: boolean
  }

  class IdsDto {
    @ApiProperty({ type: [String] })
    @IsArray()
    @ArrayMaxSize(200)
    @IsUUID('4', { each: true })
    ids!: string[]
  }

  @ApiTags(tag)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Controller(path)
  class ListController {
    constructor(
      @Inject(serviceToken) private readonly service: SimpleListService,
    ) {}

    @Get()
    @RequirePermissions(`${permission}.read`)
    @ApiOperation({
      summary: `List ${tag.toLowerCase()} (paginated, filterable)`,
    })
    @ApiResponse({ status: 200, type: PageResponseDto })
    async findAll(@Query() query: QueryDto): Promise<PageResponseDto> {
      return PageResponseDto.fromDomain(
        await this.service.list({
          page: query.page ?? 1,
          limit: query.limit ?? 10,
          search: query.search,
          isActive: query.isActive,
        }),
      )
    }

    @Get(':id')
    @RequirePermissions(`${permission}.read`)
    @ApiOperation({ summary: `Get a ${label.toLowerCase()} by ID` })
    @ApiParam({ name: 'id', format: 'uuid' })
    @ApiResponse({ status: 200, type: ItemResponseDto })
    @ApiResponse({ status: 404, description: `${label} not found` })
    async findOne(
      @Param('id', ParseUUIDPipe) id: string,
    ): Promise<ItemResponseDto> {
      return ItemResponseDto.fromDomain(await this.service.get(id))
    }

    @Post()
    @RequirePermissions(`${permission}.create`)
    @ApiOperation({ summary: `Create a ${label.toLowerCase()}` })
    @ApiResponse({ status: 201, type: ItemResponseDto })
    @ApiResponse({
      status: 409,
      description: `Duplicate ${label.toLowerCase()} name`,
    })
    async create(@Body() dto: CreateDto): Promise<ItemResponseDto> {
      return ItemResponseDto.fromDomain(
        await this.service.create({
          name: dto.name,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
        }),
      )
    }

    @Patch(':id')
    @RequirePermissions(`${permission}.update`)
    @ApiOperation({ summary: `Update a ${label.toLowerCase()}` })
    @ApiParam({ name: 'id', format: 'uuid' })
    @ApiResponse({ status: 200, type: ItemResponseDto })
    @ApiResponse({ status: 404, description: `${label} not found` })
    @ApiResponse({
      status: 409,
      description: `Duplicate ${label.toLowerCase()} name`,
    })
    async update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() dto: UpdateDto,
    ): Promise<ItemResponseDto> {
      return ItemResponseDto.fromDomain(
        await this.service.update(id, {
          name: dto.name,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
        }),
      )
    }

    @Delete(':id')
    @RequirePermissions(`${permission}.delete`)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: `Delete a ${label.toLowerCase()}` })
    @ApiParam({ name: 'id', format: 'uuid' })
    @ApiResponse({ status: 204, description: `${label} deleted` })
    @ApiResponse({ status: 404, description: `${label} not found` })
    @ApiResponse({ status: 409, description: `${label} still in use` })
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
      await this.service.remove(id)
    }
  }

  @ApiTags(tag)
  @Public()
  @UseGuards(ProvisioningTokenGuard)
  @Controller(path)
  class InternalController {
    constructor(
      @Inject(serviceToken) private readonly service: SimpleListService,
    ) {}

    @Get('active')
    @ApiOperation({ summary: `Active ${tag.toLowerCase()} for a form` })
    @ApiResponse({ status: 200, type: SummaryListResponseDto })
    @ApiResponse({
      status: 401,
      description: 'Missing or invalid provisioning token',
    })
    async active(): Promise<SummaryListResponseDto> {
      const rows = await this.service.active()
      return { data: rows.map((row) => SummaryDto.fromDomain(row)) }
    }

    @Get(':id/summary')
    @ApiOperation({ summary: `${label} name` })
    @ApiResponse({ status: 200, type: SummaryResponseDto })
    @ApiResponse({
      status: 401,
      description: 'Missing or invalid provisioning token',
    })
    async summary(
      @Param('id', ParseUUIDPipe) id: string,
    ): Promise<SummaryResponseDto> {
      const row = await this.service.summary(id)
      return { data: row ? SummaryDto.fromDomain(row) : null }
    }

    @Post('by-ids')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: `${tag} for a batch of ids` })
    @ApiResponse({ status: 200, type: SummaryListResponseDto })
    @ApiResponse({
      status: 401,
      description: 'Missing or invalid provisioning token',
    })
    async byIds(@Body() dto: IdsDto): Promise<SummaryListResponseDto> {
      const rows = await this.service.byIds(dto.ids)
      return { data: rows.map((row) => SummaryDto.fromDomain(row)) }
    }
  }

  named(ItemResponseDto, `${className}ItemResponseDto`)
  named(PageResponseMetaDto, `${className}PageResponseMetaDto`)
  named(PageResponseDto, `${className}PageResponseDto`)
  named(SummaryDto, `${className}SummaryDto`)
  named(SummaryResponseDto, `${className}SummaryResponseDto`)
  named(SummaryListResponseDto, `${className}SummaryListResponseDto`)
  named(CreateDto, `Create${className}Dto`)
  named(UpdateDto, `Update${className}Dto`)
  named(QueryDto, `${className}QueryDto`)
  named(IdsDto, `${className}IdsDto`)

  return {
    controller: named(ListController, `${className}Controller`),
    internalController: named(
      InternalController,
      `${className}InternalController`,
    ),
  }
}
