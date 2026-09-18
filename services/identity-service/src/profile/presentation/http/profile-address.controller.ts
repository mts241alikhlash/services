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
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js'
import { JwtAuthGuard } from '../../../auth/index.js'
import { RequirePermissions } from '../../../access-control/permission/decorators/require-permissions.decorator.js'
import { ProfileAddressService } from '../../application/services/profile-address.service.js'
import {
  CreateAddressDto,
  UpdateAddressDto,
} from './dto/request/address.dto.js'
import {
  AddressListResponseDto,
  AddressSingleResponseDto,
} from './dto/response/address-response.dto.js'

@ApiTags('Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profiles')
export class ProfileAddressController {
  constructor(private readonly addresses: ProfileAddressService) {}

  @Get('me/addresses')
  @ApiOperation({ summary: 'The signed-in person’s addresses' })
  @ApiResponse({ status: 200, type: AddressListResponseDto })
  async listMine(@CurrentUser('id') userId: string) {
    return this.addresses.list(userId)
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Add an address to the signed-in person' })
  @ApiResponse({ status: 201, type: AddressSingleResponseDto })
  async addMine(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAddressDto,
  ) {
    return this.addresses.add(userId, dto)
  }

  @Patch('me/addresses/:addressId')
  @ApiOperation({ summary: 'Update one of the signed-in person’s addresses' })
  @ApiParam({ name: 'addressId', format: 'uuid' })
  @ApiResponse({ status: 200, type: AddressSingleResponseDto })
  @ApiResponse({ status: 404, description: 'Not theirs, or not there' })
  async updateMine(
    @CurrentUser('id') userId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addresses.update(userId, addressId, dto)
  }

  @Delete('me/addresses/:addressId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove one of the signed-in person’s addresses' })
  @ApiParam({ name: 'addressId', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Removed' })
  @ApiResponse({ status: 404, description: 'Not theirs, or not there' })
  async removeMine(
    @CurrentUser('id') userId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ) {
    await this.addresses.remove(userId, addressId)
  }

  @Get(':userId/addresses')
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'Any person’s addresses' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiResponse({ status: 200, type: AddressListResponseDto })
  async listFor(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.addresses.list(userId)
  }

  @Post(':userId/addresses')
  @RequirePermissions('users.update')
  @ApiOperation({ summary: 'Add an address to any person' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiResponse({ status: 201, type: AddressSingleResponseDto })
  async addFor(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CreateAddressDto,
  ) {
    return this.addresses.add(userId, dto)
  }

  @Patch(':userId/addresses/:addressId')
  @RequirePermissions('users.update')
  @ApiOperation({ summary: 'Update one of any person’s addresses' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiParam({ name: 'addressId', format: 'uuid' })
  @ApiResponse({ status: 200, type: AddressSingleResponseDto })
  @ApiResponse({ status: 404, description: 'Not theirs, or not there' })
  async updateFor(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addresses.update(userId, addressId, dto)
  }

  @Delete(':userId/addresses/:addressId')
  @RequirePermissions('users.update')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove one of any person’s addresses' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiParam({ name: 'addressId', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Removed' })
  @ApiResponse({ status: 404, description: 'Not theirs, or not there' })
  async removeFor(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ) {
    await this.addresses.remove(userId, addressId)
  }
}
