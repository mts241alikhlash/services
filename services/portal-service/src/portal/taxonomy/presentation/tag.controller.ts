import { PostTagResponseDto } from '../dto/response/taxonomy-api-response.dto.js'
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
  CreateTagDto,
  TagQueryDto,
  UpdateTagDto,
} from '../dto/request/tag.dto.js'
import {
  CreateTagUseCase,
  DeleteTagUseCase,
  GetTagsUseCase,
  UpdateTagUseCase,
} from '../use-cases/manage-tag.use-cases.js'
import { PortalPublic } from '../../shared/decorators/portal-public.decorator.js'

@ApiTags('Portal — Content')
@ApiBearerAuth()
@Controller('portal/tags')
export class TagController {
  constructor(
    private readonly getTagsUseCase: GetTagsUseCase,
    private readonly createTagUseCase: CreateTagUseCase,
    private readonly updateTagUseCase: UpdateTagUseCase,
    private readonly deleteTagUseCase: DeleteTagUseCase,
  ) {}

  @Get()
  @RequirePermissions('portal-tags.read')
  @ApiOperation({ summary: 'Tags in use, optionally filtered by label' })
  async findAll(@Query() query: TagQueryDto): Promise<PostTagResponseDto[]> {
    return (await this.getTagsUseCase.execute(query.search)).map((item) =>
      PostTagResponseDto.fromDomain(item),
    )
  }

  @Post()
  @RequirePermissions('portal-tags.create')
  @ApiOperation({
    summary: 'Create a tag up front — the post form also creates on first use',
  })
  @ApiResponse({ status: 409, description: 'That tag already exists' })
  async create(@Body() dto: CreateTagDto): Promise<PostTagResponseDto> {
    return PostTagResponseDto.fromDomain(
      await this.createTagUseCase.execute(dto),
    )
  }

  @Patch(':id')
  @RequirePermissions('portal-tags.update')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Rename a tag — its public address is unchanged' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTagDto,
  ): Promise<PostTagResponseDto> {
    return PostTagResponseDto.fromDomain(
      await this.updateTagUseCase.execute(id, dto),
    )
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('portal-tags.delete')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({
    summary: 'Delete a tag — the posts it labelled are untouched',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteTagUseCase.execute(id)
  }
}

@ApiTags('Portal — Public')
@Controller('portal/public/tags')
export class TagPublicController {
  constructor(private readonly getTagsUseCase: GetTagsUseCase) {}

  @Get()
  @PortalPublic()
  @ApiOperation({ summary: 'Tags, for the public filter bar' })
  async findAll(): Promise<PostTagResponseDto[]> {
    return (await this.getTagsUseCase.execute()).map((item) =>
      PostTagResponseDto.fromDomain(item),
    )
  }
}
