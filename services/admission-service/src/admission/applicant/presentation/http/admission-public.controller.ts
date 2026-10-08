import {
  AdmissionActiveWavesResponseDto,
  AdmissionRegisteredApplicantResponseDto,
} from '../../../application/presentation/http/dto/response/admission-application-response.dto.js'
import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { Public } from '../../../../core/decorators/public.decorator.js'
import { PublicRegisterApplicantDto } from './dto/request/public-register-applicant.dto.js'
import { AdmissionGradeListResponseDto } from './dto/response/admission-grade-response.dto.js'
import { GetActiveWavesUseCase } from '../../../wave/index.js'
import {
  GetActiveGradesUseCase,
  RegisterApplicantUseCase,
} from '../../index.js'

@ApiTags('Admission — Public')
@Controller('admissions')
export class AdmissionPublicController {
  constructor(
    private readonly getActiveWavesService: GetActiveWavesUseCase,
    private readonly registerApplicantService: RegisterApplicantUseCase,
    private readonly getActiveGrades: GetActiveGradesUseCase,
  ) {}

  @Get('grades')
  @Public()
  @ApiOperation({ summary: 'Active grades an applicant can choose' })
  @ApiResponse({ status: 200, type: AdmissionGradeListResponseDto })
  async grades(): Promise<AdmissionGradeListResponseDto> {
    return AdmissionGradeListResponseDto.fromDomain({
      data: await this.getActiveGrades.execute(),
    })
  }

  @Get('waves/active')
  @Public()
  @ApiOperation({
    summary: 'Active admission waves with requirements (landing page)',
  })
  @ApiResponse({
    type: AdmissionActiveWavesResponseDto,
    status: 200,
    description: 'Active waves and document requirements',
  })
  async getActiveWaves(): Promise<AdmissionActiveWavesResponseDto> {
    return AdmissionActiveWavesResponseDto.fromDomain(
      await this.getActiveWavesService.execute(),
    )
  }

  @Post('register')
  @Public()
  @Throttle({ auth: {} })
  @ApiOperation({ summary: 'Register a new applicant account' })
  @ApiResponse({
    type: AdmissionRegisteredApplicantResponseDto,
    status: 201,
    description: 'Applicant registered',
  })
  @ApiResponse({ status: 400, description: 'Wave closed or invalid data' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() dto: PublicRegisterApplicantDto,
  ): Promise<AdmissionRegisteredApplicantResponseDto> {
    return AdmissionRegisteredApplicantResponseDto.fromDomain(
      await this.registerApplicantService.execute({
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        password: dto.password,
        passwordConfirm: dto.passwordConfirm,
        admissionType: dto.admissionType,
        targetGradeId: dto.targetGradeId,
      }),
    )
  }
}
