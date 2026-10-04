import {
  MediaLibraryItemResponseDto,
  MediaUsageResponseDto,
} from '../dto/response/media-api-response.dto.js'
import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { GetMediaLibraryUseCase } from '../use-cases/get-media-library.use-case.js'
import { GetMediaUsageUseCase } from '../use-cases/get-media-usage.use-case.js'

@ApiTags('Portal — Content')
@ApiBearerAuth()
@Controller('portal/media')
export class MediaController {
  constructor(
    private readonly getMediaLibraryUseCase: GetMediaLibraryUseCase,
    private readonly getMediaUsageUseCase: GetMediaUsageUseCase,
  ) {}

  @Get()
  @RequirePermissions('portal-posts.read')
  @ApiOperation({
    summary: 'Previously uploaded portal media, so an editor reuses (FR-055)',
  })
  async findAll(): Promise<MediaLibraryItemResponseDto[]> {
    return (await this.getMediaLibraryUseCase.execute()).map((item) =>
      MediaLibraryItemResponseDto.fromDomain(item),
    )
  }

  @Get(':fileId/usage')
  @RequirePermissions('portal-posts.read')
  @ApiParam({ name: 'fileId', format: 'uuid' })
  @ApiOperation({
    summary: 'Which content references this file, and whether it is public',
  })
  async findUsage(
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<MediaUsageResponseDto> {
    return MediaUsageResponseDto.fromDomain(
      await this.getMediaUsageUseCase.execute(fileId),
    )
  }
}
