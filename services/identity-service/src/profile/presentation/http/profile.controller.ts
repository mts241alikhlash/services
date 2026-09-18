import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js'
import { JwtAuthGuard } from '../../../auth/index.js'
import { RequirePermissions } from '../../../access-control/permission/decorators/require-permissions.decorator.js'
import { GetProfileUseCase } from '../../application/use-cases/get-profile/get-profile.use-case.js'
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile/update-profile.use-case.js'
import { SetProfileAvatarUseCase } from '../../application/use-cases/set-profile-avatar/set-profile-avatar.use-case.js'
import { ClearProfileAvatarUseCase } from '../../application/use-cases/clear-profile-avatar/clear-profile-avatar.use-case.js'
import { ProfileAvatarUrlService } from '../../application/services/profile-avatar-url.service.js'
import { UpdateProfileDto } from './dto/request/update-profile.dto.js'
import { ProfileSingleResponseDto } from './dto/response/profile-response.dto.js'

@ApiTags('Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profiles')
export class ProfileController {
  constructor(
    private readonly getProfile: GetProfileUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly setAvatar: SetProfileAvatarUseCase,
    private readonly clearAvatar: ClearProfileAvatarUseCase,
    private readonly avatarUrl: ProfileAvatarUrlService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'The signed-in person, as a profile' })
  @ApiResponse({ status: 200, type: ProfileSingleResponseDto })
  @ApiResponse({ status: 404, description: 'The account has no profile' })
  async findMine(@CurrentUser('id') userId: string) {
    return this.avatarUrl.attach(await this.getProfile.execute(userId))
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the signed-in person' })
  @ApiResponse({ status: 200, type: ProfileSingleResponseDto })
  @ApiResponse({ status: 400, description: 'Unknown religion or blood type' })
  @ApiResponse({ status: 404, description: 'The account has no profile' })
  @ApiResponse({ status: 409, description: 'NIK, email or phone is taken' })
  async updateMine(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.avatarUrl.attach(await this.updateProfile.execute(userId, dto))
  }

  @Post('me/photo')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Replace the signed-in person photo',
    description:
      'JPEG, PNG, WebP or AVIF, 2 MB at most. The previous photo is removed ' +
      'from storage once the new one is recorded.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, type: ProfileSingleResponseDto })
  @ApiResponse({ status: 413, description: 'Larger than 2 MB' })
  @ApiResponse({ status: 415, description: 'Not an accepted image type' })
  @ApiResponse({ status: 503, description: 'Object storage is not configured' })
  async setMyPhoto(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.avatarUrl.attach(await this.setAvatar.execute(userId, file))
  }

  @Delete('me/photo')
  @ApiOperation({ summary: 'Remove the signed-in person photo' })
  @ApiResponse({ status: 200, type: ProfileSingleResponseDto })
  async clearMyPhoto(@CurrentUser('id') userId: string) {
    return this.avatarUrl.attach(await this.clearAvatar.execute(userId))
  }

  @Get(':userId')
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'Any person, as a profile' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiResponse({ status: 200, type: ProfileSingleResponseDto })
  @ApiResponse({ status: 404, description: 'The account has no profile' })
  async findOne(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.avatarUrl.attach(await this.getProfile.execute(userId))
  }

  @Patch(':userId')
  @RequirePermissions('users.update')
  @ApiOperation({ summary: 'Update any person' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiResponse({ status: 200, type: ProfileSingleResponseDto })
  @ApiResponse({ status: 400, description: 'Unknown religion or blood type' })
  @ApiResponse({ status: 404, description: 'The account has no profile' })
  @ApiResponse({ status: 409, description: 'NIK, email or phone is taken' })
  async updateOne(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.avatarUrl.attach(await this.updateProfile.execute(userId, dto))
  }
}
