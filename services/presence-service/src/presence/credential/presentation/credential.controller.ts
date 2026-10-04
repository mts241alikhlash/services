import {
  CredentialListResponseDto,
  CredentialResponseDto,
  CredentialStatusResponseDto,
  CredentialWithCodeResponseDto,
} from '../dto/response/credential-response.dto.js'
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
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
import type { AuthenticatedUser } from '../../../core/types/authenticated-user.type.js'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../platform/auth/index.js'
import { PaginatedResponse } from '../../../shared/domain/interfaces/repository.interface.js'
import {
  CredentialWithCode,
  CredentialWithHolder,
} from '../domain/entities/credential.entity.js'
import { CredentialPrintQueryDto } from '../dto/request/credential-print-query.dto.js'
import { CredentialQueryDto } from '../dto/request/credential-query.dto.js'
import { IssueCredentialDto } from '../dto/request/issue-credential.dto.js'
import { RevokeCredentialDto } from '../dto/request/revoke-credential.dto.js'
import { GetCredentialsForPrintUseCase } from '../use-cases/get-credentials-for-print.use-case.js'
import {
  GetCredentialByIdUseCase,
  GetCredentialsUseCase,
} from '../use-cases/get-credentials.use-case.js'
import { IssueCredentialUseCase } from '../use-cases/issue-credential.use-case.js'
import { ReplaceCredentialUseCase } from '../use-cases/replace-credential.use-case.js'
import { RevokeCredentialUseCase } from '../use-cases/revoke-credential.use-case.js'

@ApiTags('Presence — Credentials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('presence/credentials')
export class CredentialController {
  constructor(
    private readonly getAll: GetCredentialsUseCase,
    private readonly getById: GetCredentialByIdUseCase,
    private readonly getForPrint: GetCredentialsForPrintUseCase,
    private readonly issue: IssueCredentialUseCase,
    private readonly revoke: RevokeCredentialUseCase,
    private readonly replace: ReplaceCredentialUseCase,
  ) {}

  @Get()
  @RequirePermissions('presence-credentials.read')
  @ApiOperation({ summary: 'List cards (never returns the card code)' })
  @ApiResponse({ status: 200, type: CredentialListResponseDto })
  async list(
    @Query() query: CredentialQueryDto,
  ): Promise<CredentialListResponseDto> {
    return CredentialListResponseDto.fromDomain(
      await this.getAll.execute(query),
    )
  }

  @Get('print')
  @RequirePermissions('presence-credentials.read')
  @ApiOperation({ summary: 'Card codes for a print run' })
  @ApiResponse({ status: 200, type: [CredentialWithCodeResponseDto] })
  async print(
    @Query() query: CredentialPrintQueryDto,
  ): Promise<CredentialWithCodeResponseDto[]> {
    return (await this.getForPrint.execute(query.userIds)).map((item) =>
      CredentialWithCodeResponseDto.fromDomain(item),
    )
  }

  @Get(':id')
  @RequirePermissions('presence-credentials.read')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: CredentialResponseDto })
  async detail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CredentialResponseDto> {
    return CredentialResponseDto.fromDomain(await this.getById.execute(id))
  }

  @Post()
  @RequirePermissions('presence-credentials.create')
  @ApiOperation({ summary: 'Issue a card — the code is returned once' })
  @ApiResponse({ status: 201, type: CredentialWithCodeResponseDto })
  async create(
    @Body() dto: IssueCredentialDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CredentialWithCodeResponseDto> {
    return CredentialWithCodeResponseDto.fromDomain(
      await this.issue.execute(dto, user.id),
    )
  }

  @Post(':id/revoke')
  @RequirePermissions('presence-credentials.update')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Revoke a card — ends the holder’s expected days' })
  @ApiResponse({ status: 201, type: CredentialStatusResponseDto })
  async revokeCard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokeCredentialDto,
  ): Promise<CredentialStatusResponseDto> {
    return CredentialStatusResponseDto.fromDomain(
      await this.revoke.execute(id, dto),
    )
  }

  @Post(':id/replace')
  @RequirePermissions('presence-credentials.create')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Replace a lost card — history stays continuous' })
  @ApiResponse({ status: 201, type: CredentialWithCodeResponseDto })
  async replaceCard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokeCredentialDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CredentialWithCodeResponseDto> {
    return CredentialWithCodeResponseDto.fromDomain(
      await this.replace.execute(id, dto, user.id),
    )
  }
}
