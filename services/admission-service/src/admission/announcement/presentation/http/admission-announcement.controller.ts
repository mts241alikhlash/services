import {
  AdmissionAnnouncementListResponseDto,
  AdmissionAnnouncementResponseDto,
} from './dto/response/admission-announcement-response.dto.js'
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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../../core/decorators/current-user.decorator.js'
import type { AuthenticatedUser } from '../../../../core/types/authenticated-user.type.js'
import { RequirePermissions } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../../platform/auth/index.js'
import { AdmissionAnnouncementQueryDto } from './dto/request/admission-announcement-query.dto.js'
import { CreateAdmissionAnnouncementDto } from './dto/request/create-admission-announcement.dto.js'
import { UpdateAdmissionAnnouncementDto } from './dto/request/update-admission-announcement.dto.js'
import { GetAdmissionAnnouncementsUseCase } from '../../application/use-cases/get-admission-announcements/get-admission-announcements.use-case.js'
import { CreateAdmissionAnnouncementUseCase } from '../../application/use-cases/create-admission-announcement/create-admission-announcement.use-case.js'
import { UpdateAdmissionAnnouncementUseCase } from '../../application/use-cases/update-admission-announcement/update-admission-announcement.use-case.js'
import { PublishAdmissionAnnouncementUseCase } from '../../application/use-cases/publish-admission-announcement/publish-admission-announcement.use-case.js'
import { DeleteAdmissionAnnouncementUseCase } from '../../application/use-cases/delete-admission-announcement/delete-admission-announcement.use-case.js'

@ApiTags('Admission — Announcements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admissions/manage-announcements')
export class AdmissionAnnouncementController {
  constructor(
    private readonly getAnnouncementsService: GetAdmissionAnnouncementsUseCase,
    private readonly createAnnouncementService: CreateAdmissionAnnouncementUseCase,
    private readonly updateAnnouncementService: UpdateAdmissionAnnouncementUseCase,
    private readonly publishAnnouncementService: PublishAdmissionAnnouncementUseCase,
    private readonly deleteAnnouncementService: DeleteAdmissionAnnouncementUseCase,
  ) {}

  @Get()
  @RequirePermissions('admission-announcements.read')
  @ApiOperation({ summary: 'List admission announcements (admin)' })
  async findAll(
    @Query() query: AdmissionAnnouncementQueryDto,
  ): Promise<AdmissionAnnouncementListResponseDto> {
    return AdmissionAnnouncementListResponseDto.fromDomain(
      await this.getAnnouncementsService.execute(query),
    )
  }

  @Post()
  @RequirePermissions('admission-announcements.create')
  @ApiOperation({ summary: 'Create an admission announcement' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAdmissionAnnouncementDto,
  ): Promise<AdmissionAnnouncementResponseDto> {
    return AdmissionAnnouncementResponseDto.fromDomain(
      await this.createAnnouncementService.execute(dto, user.id),
    )
  }

  @Patch(':id')
  @RequirePermissions('admission-announcements.update')
  @ApiOperation({ summary: 'Update an admission announcement' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdmissionAnnouncementDto,
  ): Promise<AdmissionAnnouncementResponseDto> {
    return AdmissionAnnouncementResponseDto.fromDomain(
      await this.updateAnnouncementService.execute(id, dto),
    )
  }

  @Post(':id/publish')
  @RequirePermissions('admission-announcements.update')
  @ApiOperation({ summary: 'Publish + notify applicants in scope' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdmissionAnnouncementResponseDto> {
    return AdmissionAnnouncementResponseDto.fromDomain(
      await this.publishAnnouncementService.execute(id),
    )
  }

  @Delete(':id')
  @RequirePermissions('admission-announcements.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an admission announcement' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteAnnouncementService.execute(id)
  }
}
