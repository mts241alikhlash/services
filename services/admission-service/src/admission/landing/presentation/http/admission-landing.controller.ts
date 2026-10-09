import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '../../../../core/decorators/current-user.decorator.js'
import type { AuthenticatedUser } from '../../../../core/types/authenticated-user.type.js'
import { UPLOAD_LIMITS } from '../../../../core/upload/upload-limits.js'
import { RequirePermissions } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../../platform/auth/index.js'
import { DiscardLandingUseCase } from '../../application/use-cases/discard-landing/discard-landing.use-case.js'
import { GetLandingUseCase } from '../../application/use-cases/get-landing/get-landing.use-case.js'
import { PublishLandingUseCase } from '../../application/use-cases/publish-landing/publish-landing.use-case.js'
import { SaveLandingSectionUseCase } from '../../application/use-cases/save-landing-section/save-landing-section.use-case.js'
import { UploadLandingImageUseCase } from '../../application/use-cases/upload-landing-image/upload-landing-image.use-case.js'
import {
  SaveAdmissionLandingSectionDto,
  UploadAdmissionLandingImageDto,
} from './dto/request/landing.dto.js'
import {
  AdmissionLandingDraftResponseDto,
  AdmissionLandingImageResponseDto,
} from './dto/response/landing-response.dto.js'

@ApiTags('Admission — Landing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admissions/landing')
export class AdmissionLandingController {
  constructor(
    private readonly getLanding: GetLandingUseCase,
    private readonly saveSectionUseCase: SaveLandingSectionUseCase,
    private readonly uploadImageUseCase: UploadLandingImageUseCase,
    private readonly publishUseCase: PublishLandingUseCase,
    private readonly discardUseCase: DiscardLandingUseCase,
  ) {}

  @Get('draft')
  @RequirePermissions('admission-landing.read')
  @ApiOperation({
    summary: 'The landing content as staff see it: draft over published',
  })
  @ApiResponse({ status: 200, type: AdmissionLandingDraftResponseDto })
  async draft(): Promise<AdmissionLandingDraftResponseDto> {
    return AdmissionLandingDraftResponseDto.fromDomain(
      await this.getLanding.draft(),
    )
  }

  @Put('sections/:key')
  @RequirePermissions('admission-landing.update')
  @ApiOperation({ summary: 'Save the draft of one section' })
  @ApiParam({ name: 'key', example: 'hero' })
  @ApiResponse({ status: 200, type: AdmissionLandingDraftResponseDto })
  @ApiResponse({ status: 400, description: 'Isi tidak valid' })
  async saveSection(
    @Param('key') key: string,
    @Body() dto: SaveAdmissionLandingSectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AdmissionLandingDraftResponseDto> {
    return AdmissionLandingDraftResponseDto.fromDomain(
      await this.saveSectionUseCase.execute(key, dto.content, user.id),
    )
  }

  @Post('images')
  @RequirePermissions('admission-landing.update')
  @UseInterceptors(FileInterceptor('file', { limits: UPLOAD_LIMITS }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'purpose'],
      properties: {
        purpose: { type: 'string', enum: ['poster', 'photo'] },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload an image; it is converted to WebP' })
  @ApiResponse({ status: 201, type: AdmissionLandingImageResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Berkas harus gambar JPG, PNG, atau WebP dan maksimal 5 MB',
  })
  async uploadImage(
    @Body() dto: UploadAdmissionLandingImageDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AdmissionLandingImageResponseDto> {
    return AdmissionLandingImageResponseDto.fromDomain(
      await this.uploadImageUseCase.execute({
        file,
        purpose: dto.purpose,
        userId: user.id,
      }),
    )
  }

  @Post('publish')
  @RequirePermissions('admission-landing.publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish every draft at once' })
  @ApiResponse({ status: 200, type: AdmissionLandingDraftResponseDto })
  @ApiResponse({
    status: 409,
    description: 'Tidak ada perubahan untuk diterbitkan',
  })
  async publish(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AdmissionLandingDraftResponseDto> {
    return AdmissionLandingDraftResponseDto.fromDomain(
      await this.publishUseCase.execute(user.id),
    )
  }

  @Post('discard')
  @RequirePermissions('admission-landing.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Discard every draft' })
  @ApiResponse({ status: 200, type: AdmissionLandingDraftResponseDto })
  async discard(): Promise<AdmissionLandingDraftResponseDto> {
    return AdmissionLandingDraftResponseDto.fromDomain(
      await this.discardUseCase.execute(),
    )
  }
}
