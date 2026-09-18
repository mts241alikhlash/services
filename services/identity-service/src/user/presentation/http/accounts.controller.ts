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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '../../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../guards/provisioning-token.guard.js'
import { ProvisionAccountDto } from './dto/request/provision-account.dto.js'
import { SetAccountActiveDto } from './dto/request/set-account-active.dto.js'
import { UpdateAccountProfileDto } from './dto/request/update-account-profile.dto.js'
import { AssignAccountRoleDto } from './dto/request/assign-account-role.dto.js'
import { ProvisionedAccountResponseDto } from './dto/response/provisioned-account-response.dto.js'
import { AccountProfileResponseDto } from './dto/response/account-profile-response.dto.js'
import { AccountLookupResponseDto } from './dto/response/account-lookup-response.dto.js'
import { AccountSummaryResponseDto } from './dto/response/account-summary-response.dto.js'
import { UserResponseDto } from './dto/response/user-response.dto.js'
import { ProvisionAccountUseCase } from '../../application/use-cases/provision-account/provision-account.use-case.js'
import { DeleteUserUseCase } from '../../application/use-cases/delete-user/delete-user.use-case.js'
import { SetAccountActiveUseCase } from '../../application/use-cases/set-account-active/set-account-active.use-case.js'
import { UpdateAccountProfileUseCase } from '../../application/use-cases/update-account-profile/update-account-profile.use-case.js'
import { LookupAccountUseCase } from '../../application/use-cases/lookup-account/lookup-account.use-case.js'
import { AssignAccountRoleUseCase } from '../../application/use-cases/assign-account-role/assign-account-role.use-case.js'
import { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id/get-user-by-id.use-case.js'

@ApiTags('Accounts')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly provisionAccountUseCase: ProvisionAccountUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly setAccountActiveUseCase: SetAccountActiveUseCase,
    private readonly updateAccountProfileUseCase: UpdateAccountProfileUseCase,
    private readonly lookupAccountUseCase: LookupAccountUseCase,
    private readonly assignAccountRoleUseCase: AssignAccountRoleUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
  ) {}

  @Get('lookup')
  @ApiOperation({
    summary: 'Check whether an identifier or NIK is already taken',
  })
  @ApiResponse({ status: 200, type: AccountLookupResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async lookup(
    @Query('identifier') identifier?: string,
    @Query('nik') nik?: string,
  ): Promise<AccountLookupResponseDto> {
    return this.lookupAccountUseCase.execute(identifier, nik)
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Resolve the account behind a role record' })
  @ApiResponse({ status: 200, type: AccountSummaryResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async findOne(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<AccountSummaryResponseDto> {
    const user = await this.getUserByIdUseCase.execute(userId)
    return {
      id: user.id,
      identifier: user.identifier,
      lastLoginAt: user.lastLoginAt,
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Provision the account behind a role record' })
  @ApiResponse({
    status: 201,
    description: 'Account created',
    type: ProvisionedAccountResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  @ApiResponse({ status: 409, description: 'Identifier already taken' })
  async provision(@Body() dto: ProvisionAccountDto): Promise<{ id: string }> {
    return this.provisionAccountUseCase.execute(dto)
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Undo a provisioned account (compensating delete), or soft-delete one the caller owns',
  })
  @ApiResponse({ status: 204, description: 'Account deleted' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async deprovision(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    await this.deleteUserUseCase.execute(userId)
  }

  @Patch(':userId')
  @ApiOperation({ summary: "Set an account's active status" })
  @ApiResponse({
    status: 200,
    description: 'Account updated',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async setActive(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SetAccountActiveDto,
  ) {
    return this.setAccountActiveUseCase.execute(userId, dto.isActive)
  }

  @Patch(':userId/profile')
  @ApiOperation({ summary: "Update an account's profile fields" })
  @ApiResponse({
    status: 200,
    description: 'Profile updated',
    type: AccountProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  @ApiResponse({ status: 404, description: 'Account or profile not found' })
  @ApiResponse({ status: 409, description: 'NIK already registered' })
  async updateProfile(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateAccountProfileDto,
  ): Promise<AccountProfileResponseDto> {
    return this.updateAccountProfileUseCase.execute(userId, dto)
  }

  @Post(':userId/roles')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Grant a structural role to an existing account' })
  @ApiResponse({ status: 204, description: 'Role assigned' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async assignRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: AssignAccountRoleDto,
  ): Promise<void> {
    await this.assignAccountRoleUseCase.execute(userId, dto.roleCode)
  }
}
