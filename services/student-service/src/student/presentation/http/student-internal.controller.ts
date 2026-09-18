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
import { ProvisioningTokenGuard } from '../../../core/guards/provisioning-token.guard.js'
import { IStudentIdentityReadPort } from '../../domain/repositories/student-identity-read.port.js'

export class StudentIdByUserResponseDto {
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'null when the account owns no student record',
  })
  data!: { studentId: string | null }
}

export class StudentIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('4', { each: true })
  ids!: string[]
}

export class StudentRefDto {
  @ApiProperty() id!: string

  @ApiProperty({
    description:
      "The student's account, so the caller resolves the name against " +
      'identity-service rather than against this service.',
  })
  userId!: string

  @ApiProperty() nis!: string
}

export class StudentRefListResponseDto {
  @ApiProperty({ type: [StudentRefDto] })
  data!: StudentRefDto[]
}

@ApiTags('Students')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('students')
export class StudentInternalController {
  constructor(private readonly studentIdentityRead: IStudentIdentityReadPort) {}

  @Post('by-ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Students for a batch of ids',
    description:
      'academic-service holds the four class officers as ids on a ' +
      'classroom structure and renders a name and a NIS beside each. Ids ' +
      'that match nothing are absent from the response rather than returned ' +
      'as null.',
  })
  @ApiResponse({ status: 200, type: StudentRefListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byIds(@Body() dto: StudentIdsDto): Promise<StudentRefListResponseDto> {
    return { data: await this.studentIdentityRead.listRefsByIds(dto.ids) }
  }

  @Get('by-user/:userId')
  @ApiOperation({ summary: 'Resolve an account to its student record' })
  @ApiResponse({ status: 200, type: StudentIdByUserResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<StudentIdByUserResponseDto> {
    return {
      data: {
        studentId: await this.studentIdentityRead.findStudentIdByUserId(userId),
      },
    }
  }
}
