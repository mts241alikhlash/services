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

import { JwtAuthGuard } from '../../../auth/index.js'

import { CreateUserDto } from './dto/request/create-user.dto.js'
import { UpdateUserDto } from './dto/request/update-user.dto.js'
import { UserQueryDto } from './dto/request/user-query.dto.js'
import {
  UserListResponseDto,
  UserResponseDto,
  UserSummaryResponseDto,
} from './dto/response/user-response.dto.js'

import { CreateUserUseCase } from '../../application/use-cases/create-user/create-user.use-case.js'
import { DeleteUserUseCase } from '../../application/use-cases/delete-user/delete-user.use-case.js'
import { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id/get-user-by-id.use-case.js'
import { GetUserSummaryUseCase } from '../../application/use-cases/get-user-summary/get-user-summary.use-case.js'
import { GetUsersUseCase } from '../../application/use-cases/get-users/get-users.use-case.js'
import { UpdateUserUseCase } from '../../application/use-cases/update-user/update-user.use-case.js'

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly getUserSummaryUseCase: GetUserSummaryUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Post()
  @RequirePermissions('users.create')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Identifier already taken' })
  async create(@Body() dto: CreateUserDto) {
    return this.createUserUseCase.execute(dto)
  }

  @Get()
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'List all users (paginated, filterable)' })
  @ApiResponse({ status: 200, type: UserListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: UserQueryDto) {
    return this.getUsersUseCase.execute(query)
  }

  @Get('summary')
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'Account counts for the administration dashboard' })
  @ApiResponse({ status: 200, type: UserSummaryResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async summary() {
    return this.getUserSummaryUseCase.execute()
  }

  @Get(':id')
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'User details',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getUserByIdUseCase.execute(id)
  }

  @Patch(':id')
  @RequirePermissions('users.update')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'User updated',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Identifier already taken' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.updateUserUseCase.execute(id, dto)
  }

  @Delete(':id')
  @RequirePermissions('users.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteUserUseCase.execute(id)
  }
}
