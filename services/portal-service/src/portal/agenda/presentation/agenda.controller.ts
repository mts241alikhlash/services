import {
  AgendaAdminListResponseDto,
  AgendaAdminResponseDto,
} from '../dto/response/agenda-api-response.dto.js'
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
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import type { AuthenticatedUser } from '../../../core/types/authenticated-user.type.js'
import {
  AgendaQueryDto,
  AgendaVersionDto,
  CreateAgendaDto,
  PublishAgendaDto,
  UpdateAgendaDto,
} from '../dto/request/agenda.dto.js'
import {
  ArchiveAgendaUseCase,
  CreateAgendaUseCase,
  DeleteAgendaUseCase,
  GetAgendaByIdUseCase,
  GetAgendaEntriesUseCase,
  PublishAgendaUseCase,
  RestoreAgendaUseCase,
  UnpublishAgendaUseCase,
  UpdateAgendaUseCase,
} from '../use-cases/manage-agenda.use-cases.js'

@ApiTags('Portal — Content')
@ApiBearerAuth()
@Controller('portal/agenda')
export class AgendaController {
  constructor(
    private readonly getAgendaEntriesUseCase: GetAgendaEntriesUseCase,
    private readonly getAgendaByIdUseCase: GetAgendaByIdUseCase,
    private readonly createAgendaUseCase: CreateAgendaUseCase,
    private readonly updateAgendaUseCase: UpdateAgendaUseCase,
    private readonly publishAgendaUseCase: PublishAgendaUseCase,
    private readonly unpublishAgendaUseCase: UnpublishAgendaUseCase,
    private readonly archiveAgendaUseCase: ArchiveAgendaUseCase,
    private readonly deleteAgendaUseCase: DeleteAgendaUseCase,
    private readonly restoreAgendaUseCase: RestoreAgendaUseCase,
  ) {}

  @Get()
  @RequirePermissions('portal-agendas.read')
  @ApiOperation({ summary: 'Agenda entries for management' })
  async findAll(
    @Query() query: AgendaQueryDto,
  ): Promise<AgendaAdminListResponseDto> {
    return AgendaAdminListResponseDto.fromDomain(
      await this.getAgendaEntriesUseCase.execute(query),
    )
  }

  @Get(':id')
  @RequirePermissions('portal-agendas.read')
  @ApiParam({ name: 'id', format: 'uuid' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AgendaAdminResponseDto> {
    return AgendaAdminResponseDto.fromDomain(
      await this.getAgendaByIdUseCase.execute(id),
    )
  }

  @Post()
  @RequirePermissions('portal-agendas.create')
  @ApiOperation({ summary: 'Create an entry — always starts as a draft' })
  @ApiResponse({ status: 400, description: 'endTime is not after startTime' })
  async create(
    @Body() dto: CreateAgendaDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AgendaAdminResponseDto> {
    return AgendaAdminResponseDto.fromDomain(
      await this.createAgendaUseCase.execute(dto, user.id),
    )
  }

  @Patch(':id')
  @RequirePermissions('portal-agendas.update')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 409, description: 'Someone else saved first' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgendaDto,
  ): Promise<AgendaAdminResponseDto> {
    return AgendaAdminResponseDto.fromDomain(
      await this.updateAgendaUseCase.execute(id, dto),
    )
  }

  @Post(':id/publish')
  @RequirePermissions('portal-agendas.publish')
  @ApiParam({ name: 'id', format: 'uuid' })
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishAgendaDto,
  ): Promise<AgendaAdminResponseDto> {
    return AgendaAdminResponseDto.fromDomain(
      await this.publishAgendaUseCase.execute(id, dto),
    )
  }

  @Post(':id/unpublish')
  @RequirePermissions('portal-agendas.publish')
  @ApiParam({ name: 'id', format: 'uuid' })
  async unpublish(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AgendaVersionDto,
  ): Promise<AgendaAdminResponseDto> {
    return AgendaAdminResponseDto.fromDomain(
      await this.unpublishAgendaUseCase.execute(id, dto),
    )
  }

  @Post(':id/archive')
  @RequirePermissions('portal-agendas.publish')
  @ApiParam({ name: 'id', format: 'uuid' })
  async archive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AgendaVersionDto,
  ): Promise<AgendaAdminResponseDto> {
    return AgendaAdminResponseDto.fromDomain(
      await this.archiveAgendaUseCase.execute(id, dto),
    )
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('portal-agendas.delete')
  @ApiParam({ name: 'id', format: 'uuid' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteAgendaUseCase.execute(id)
  }

  @Post(':id/restore')
  @RequirePermissions('portal-agendas.delete')
  @ApiParam({ name: 'id', format: 'uuid' })
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AgendaAdminResponseDto> {
    return AgendaAdminResponseDto.fromDomain(
      await this.restoreAgendaUseCase.execute(id),
    )
  }
}
