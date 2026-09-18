import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Public } from '../../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../../user/guards/provisioning-token.guard.js'
import { IProfileAddressRepository } from '../../domain/repositories/profile-address.repository.js'
import { ProfileAddressService } from '../../application/services/profile-address.service.js'
import { CreateAddressDto } from './dto/request/address.dto.js'
import {
  AddressBatchResponseDto,
  AddressSingleResponseDto,
} from './dto/response/address-response.dto.js'

export class RecordAddressDto extends CreateAddressDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  userId!: string
}

export class BatchAddressLookupDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  userIds!: string[]
}

@ApiTags('Profiles')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('addresses')
export class AddressInternalController {
  constructor(
    private readonly addresses: IProfileAddressRepository,
    private readonly addressService: ProfileAddressService,
  ) {}

  @Post('by-user-ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve the addresses behind a batch of user ids',
  })
  @ApiResponse({ status: 200, type: AddressBatchResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byUserIds(
    @Body() dto: BatchAddressLookupDto,
  ): Promise<AddressBatchResponseDto> {
    const data = await this.addresses.findByUserIds(dto.userIds)
    return { data }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record an address on an account that already exists',
  })
  @ApiResponse({ status: 201, type: AddressSingleResponseDto })
  @ApiResponse({ status: 404, description: 'The account has no profile' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async record(@Body() dto: RecordAddressDto) {
    const { userId, ...address } = dto
    return this.addressService.add(userId, address)
  }
}
