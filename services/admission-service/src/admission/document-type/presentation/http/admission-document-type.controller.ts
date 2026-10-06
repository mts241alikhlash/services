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
  Put,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { RequirePermissions } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../../platform/auth/index.js'
import { GetDocumentTypesUseCase } from '../../application/use-cases/get-document-types/get-document-types.use-case.js'
import { SaveDocumentTypeUseCase } from '../../application/use-cases/save-document-type/save-document-type.use-case.js'
import { ReorderDocumentTypesUseCase } from '../../application/use-cases/reorder-document-types/reorder-document-types.use-case.js'
import { DeleteDocumentTypeUseCase } from '../../application/use-cases/delete-document-type/delete-document-type.use-case.js'
import {
  CreateAdmissionDocumentTypeDto,
  ReorderAdmissionDocumentTypesDto,
  UpdateAdmissionDocumentTypeDto,
} from './dto/request/save-admission-document-type.dto.js'
import {
  AdmissionDocumentTypeListResponseDto,
  AdmissionDocumentTypeResponseDto,
} from './dto/response/admission-document-type-response.dto.js'

@ApiTags('Admission — Document types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admissions/document-types')
export class AdmissionDocumentTypeController {
  constructor(
    private readonly getDocumentTypes: GetDocumentTypesUseCase,
    private readonly saveDocumentType: SaveDocumentTypeUseCase,
    private readonly reorderDocumentTypes: ReorderDocumentTypesUseCase,
    private readonly deleteDocumentType: DeleteDocumentTypeUseCase,
  ) {}

  @Get()
  @RequirePermissions('admission-document-types.read')
  @ApiOperation({ summary: 'List every document type, inactive included' })
  @ApiResponse({ status: 200, type: AdmissionDocumentTypeListResponseDto })
  async findAll(): Promise<AdmissionDocumentTypeListResponseDto> {
    return AdmissionDocumentTypeListResponseDto.fromDomain(
      await this.getDocumentTypes.execute(),
    )
  }

  @Post()
  @RequirePermissions('admission-document-types.create')
  @ApiOperation({ summary: 'Add a document type at the end of the list' })
  @ApiResponse({ status: 201, type: AdmissionDocumentTypeResponseDto })
  @ApiResponse({ status: 409, description: 'Nama jenis berkas sudah ada' })
  async create(
    @Body() dto: CreateAdmissionDocumentTypeDto,
  ): Promise<AdmissionDocumentTypeResponseDto> {
    return AdmissionDocumentTypeResponseDto.fromDomain(
      await this.saveDocumentType.create(dto),
    )
  }

  @Put('order')
  @RequirePermissions('admission-document-types.update')
  @ApiOperation({ summary: 'Reorder every document type' })
  @ApiResponse({ status: 200, type: AdmissionDocumentTypeListResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Urutan jenis berkas tidak lengkap',
  })
  async reorder(
    @Body() dto: ReorderAdmissionDocumentTypesDto,
  ): Promise<AdmissionDocumentTypeListResponseDto> {
    return AdmissionDocumentTypeListResponseDto.fromDomain(
      await this.reorderDocumentTypes.execute(dto.ids),
    )
  }

  @Patch(':id')
  @RequirePermissions('admission-document-types.update')
  @ApiOperation({ summary: 'Rename, mark required or (de)activate a type' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: AdmissionDocumentTypeResponseDto })
  @ApiResponse({ status: 409, description: 'Nama jenis berkas sudah ada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdmissionDocumentTypeDto,
  ): Promise<AdmissionDocumentTypeResponseDto> {
    return AdmissionDocumentTypeResponseDto.fromDomain(
      await this.saveDocumentType.update(id, dto),
    )
  }

  @Delete(':id')
  @RequirePermissions('admission-document-types.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document type no applicant has used' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 409,
    description: 'Jenis berkas sudah dipakai, nonaktifkan saja',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteDocumentType.execute(id)
  }
}
