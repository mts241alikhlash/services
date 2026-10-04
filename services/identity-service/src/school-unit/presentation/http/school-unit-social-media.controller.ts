import { SchoolUnitSocialMediaItemResponseDto } from './dto/response/school-unit-api-response.dto.js'
import { RequirePermissions } from '../../../access-control/permission/decorators/require-permissions.decorator.js'
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
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/index.js'
import { SchoolUnitSocialMediaResponseDto } from './dto/response/school-unit-social-media-response.dto.js'
import { CreateSchoolUnitSocialMediaDto } from './dto/request/create-school-unit-social-media.dto.js'
import { UpdateSchoolUnitSocialMediaDto } from './dto/request/update-school-unit-social-media.dto.js'
import { SchoolUnitSocialMediaUseCase } from '../../application/use-cases/school-unit-social-media/school-unit-social-media.use-case.js'

@ApiTags('School Unit Social Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('school-unit-social-medias')
export class SchoolUnitSocialMediaController {
  constructor(private readonly useCase: SchoolUnitSocialMediaUseCase) {}

  @Get()
  @RequirePermissions('school-units.read')
  @ApiOperation({ summary: 'Get school unit social media links' })
  @ApiResponse({ status: 200, type: [SchoolUnitSocialMediaItemResponseDto] })
  async findAll(): Promise<SchoolUnitSocialMediaItemResponseDto[]> {
    return (await this.useCase.findAll()).map((item) =>
      SchoolUnitSocialMediaItemResponseDto.fromDomain(item),
    )
  }

  @Post()
  @RequirePermissions('school-units.create')
  @ApiOperation({ summary: 'Add social media link to school unit' })
  @ApiResponse({ status: 201, type: SchoolUnitSocialMediaItemResponseDto })
  @ApiResponse({ status: 409, description: 'Platform already linked' })
  async create(
    @Body() dto: CreateSchoolUnitSocialMediaDto,
  ): Promise<SchoolUnitSocialMediaItemResponseDto> {
    return SchoolUnitSocialMediaItemResponseDto.fromDomain(
      await this.useCase.create(dto),
    )
  }

  @Patch(':id')
  @RequirePermissions('school-units.update')
  @ApiOperation({ summary: 'Update a social media link entry' })
  @ApiParam({ name: 'id', description: 'Social media link ID', format: 'uuid' })
  @ApiResponse({ status: 200, type: SchoolUnitSocialMediaItemResponseDto })
  @ApiResponse({ status: 404, description: 'Social media link not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSchoolUnitSocialMediaDto,
  ): Promise<SchoolUnitSocialMediaItemResponseDto> {
    return SchoolUnitSocialMediaItemResponseDto.fromDomain(
      await this.useCase.update(id, dto),
    )
  }

  @Delete(':id')
  @RequirePermissions('school-units.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a social media link' })
  @ApiParam({ name: 'id', description: 'Social media link ID', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Social media link removed' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.useCase.remove(id)
  }
}
