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
import { RequirePermissions } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../../platform/auth/index.js'
import { GetBankAccountsUseCase } from '../../application/use-cases/get-bank-accounts/get-bank-accounts.use-case.js'
import { SaveBankAccountUseCase } from '../../application/use-cases/save-bank-account/save-bank-account.use-case.js'
import { DeleteBankAccountUseCase } from '../../application/use-cases/delete-bank-account/delete-bank-account.use-case.js'
import {
  CreateAdmissionBankAccountDto,
  UpdateAdmissionBankAccountDto,
} from './dto/request/save-admission-bank-account.dto.js'
import {
  AdmissionBankAccountListResponseDto,
  AdmissionBankAccountResponseDto,
} from './dto/response/admission-bank-account-response.dto.js'

@ApiTags('Admission — Bank accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admissions/bank-accounts')
export class AdmissionBankAccountController {
  constructor(
    private readonly getBankAccounts: GetBankAccountsUseCase,
    private readonly saveBankAccount: SaveBankAccountUseCase,
    private readonly deleteBankAccount: DeleteBankAccountUseCase,
  ) {}

  @Get()
  @RequirePermissions('admission-bank-accounts.read')
  @ApiOperation({ summary: 'List the accounts applicants transfer to' })
  @ApiResponse({ status: 200, type: AdmissionBankAccountListResponseDto })
  async findAll(): Promise<AdmissionBankAccountListResponseDto> {
    return AdmissionBankAccountListResponseDto.fromDomain(
      await this.getBankAccounts.execute(),
    )
  }

  @Post()
  @RequirePermissions('admission-bank-accounts.create')
  @ApiOperation({ summary: 'Add an account applicants transfer to' })
  @ApiResponse({ status: 201, type: AdmissionBankAccountResponseDto })
  async create(
    @Body() dto: CreateAdmissionBankAccountDto,
  ): Promise<AdmissionBankAccountResponseDto> {
    return AdmissionBankAccountResponseDto.fromDomain(
      await this.saveBankAccount.create(dto),
    )
  }

  @Patch(':id')
  @RequirePermissions('admission-bank-accounts.update')
  @ApiOperation({ summary: 'Update an account applicants transfer to' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: AdmissionBankAccountResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdmissionBankAccountDto,
  ): Promise<AdmissionBankAccountResponseDto> {
    return AdmissionBankAccountResponseDto.fromDomain(
      await this.saveBankAccount.update(id, dto),
    )
  }

  @Delete(':id')
  @RequirePermissions('admission-bank-accounts.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete an account; payments that named it keep it',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteBankAccount.execute(id)
  }
}
