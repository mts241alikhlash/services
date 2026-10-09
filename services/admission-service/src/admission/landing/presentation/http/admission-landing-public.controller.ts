import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Res,
  StreamableFile,
} from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { Response } from 'express'
import { Public } from '../../../../core/decorators/public.decorator.js'
import { GetLandingImageUseCase } from '../../application/use-cases/get-landing-image/get-landing-image.use-case.js'
import { GetLandingUseCase } from '../../application/use-cases/get-landing/get-landing.use-case.js'
import { AdmissionLandingPublishedResponseDto } from './dto/response/landing-response.dto.js'

@ApiTags('Admission — Public')
@Controller('admissions/landing')
export class AdmissionLandingPublicController {
  constructor(
    private readonly getLanding: GetLandingUseCase,
    private readonly getLandingImage: GetLandingImageUseCase,
  ) {}

  @Get()
  @Public()
  @Header('Cache-Control', 'public, max-age=60')
  @ApiOperation({
    summary: 'Published landing page content (null = built-in content)',
  })
  @ApiResponse({ status: 200, type: AdmissionLandingPublishedResponseDto })
  async published(): Promise<AdmissionLandingPublishedResponseDto> {
    return AdmissionLandingPublishedResponseDto.fromDomain(
      await this.getLanding.published(),
    )
  }

  @Get('images/:id')
  @Public()
  @ApiOperation({ summary: 'A landing image as WebP' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'The WebP bytes',
    content: { 'image/webp': { schema: { type: 'string', format: 'binary' } } },
  })
  @ApiResponse({ status: 404, description: 'Gambar tidak ditemukan' })
  async image(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { image, stream } = await this.getLandingImage.execute(id)
    res.set({
      'Content-Type': 'image/webp',
      'Content-Length': String(image.sizeBytes),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=31536000, immutable',
    })
    return new StreamableFile(stream)
  }
}
