import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator'
import {
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Public } from '../../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../guards/provisioning-token.guard.js'
import { IEmployeeIdentityReadPort } from '../../domain/repositories/employee-identity-read.port.js'
import { EmployeeRosterResponseDto } from './dto/response/employee-roster-response.dto.js'

export class EmployeeIdByUserResponseDto {
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'null when the account owns no employee record',
  })
  data!: { employeeId: string | null }
}

export class EmployeeExistsResponseDto {
  @ApiProperty({ description: 'false when missing or soft-deleted' })
  data!: { exists: boolean }
}

export class EmployeeIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('4', { each: true })
  ids!: string[]
}

export class EmployeeRefDto {
  @ApiProperty() id!: string

  @ApiProperty({
    description:
      "The employee's account, so the caller resolves the name against " +
      'identity-service rather than against this service.',
  })
  userId!: string

  @ApiProperty({ nullable: true }) nip!: string | null
}

export class EmployeeRefListResponseDto {
  @ApiProperty({ type: [EmployeeRefDto] })
  data!: EmployeeRefDto[]
}

@ApiTags('Employees')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('employees')
export class EmployeeInternalController {
  constructor(
    private readonly employeeIdentityRead: IEmployeeIdentityReadPort,
  ) {}

  @Get('roster')
  @ApiOperation({
    summary: 'User ids of every employee, for payroll',
    description:
      'Deliberately returns ids alone: the caller resolves names and the ' +
      'active flag from identity-service, so a field added to the employee ' +
      'record here cannot change what payroll reads. Not filtered by ' +
      'position, position category, or employment type (FR-055, FR-056).',
  })
  @ApiResponse({ status: 200, type: EmployeeRosterResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async roster(): Promise<EmployeeRosterResponseDto> {
    return { data: await this.employeeIdentityRead.listRosterUserIds() }
  }

  @Post('by-ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Employees for a batch of ids',
    description:
      'academic-service holds `employee_id` on teaching assignments and ' +
      'classroom supervisors and renders a name beside each. Ids that match ' +
      'nothing are absent from the response rather than returned as null.',
  })
  @ApiResponse({ status: 200, type: EmployeeRefListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byIds(
    @Body() dto: EmployeeIdsDto,
  ): Promise<EmployeeRefListResponseDto> {
    return { data: await this.employeeIdentityRead.listRefsByIds(dto.ids) }
  }

  @Get('by-user/:userId')
  @ApiOperation({ summary: 'Resolve an account to its employee record' })
  @ApiResponse({ status: 200, type: EmployeeIdByUserResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<EmployeeIdByUserResponseDto> {
    return {
      data: {
        employeeId:
          await this.employeeIdentityRead.findEmployeeIdByUserId(userId),
      },
    }
  }

  @Get(':id/exists')
  @ApiOperation({ summary: 'Whether an employee record exists and is live' })
  @ApiResponse({ status: 200, type: EmployeeExistsResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async exists(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EmployeeExistsResponseDto> {
    return {
      data: { exists: await this.employeeIdentityRead.employeeExists(id) },
    }
  }
}
