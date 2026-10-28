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
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../platform/auth/index.js'
import { CopyExamPackageUseCase } from '../../application/use-cases/copy-exam-package/copy-exam-package.use-case.js'
import { CreateExamPackageUseCase } from '../../application/use-cases/create-exam-package/create-exam-package.use-case.js'
import { DeleteExamPackageUseCase } from '../../application/use-cases/delete-exam-package/delete-exam-package.use-case.js'
import { GetExamPackageUseCase } from '../../application/use-cases/get-exam-package/get-exam-package.use-case.js'
import { ListPackageCandidatesUseCase } from '../../application/use-cases/list-package-candidates/list-package-candidates.use-case.js'
import { ListExamPackagesUseCase } from '../../application/use-cases/list-exam-packages/list-exam-packages.use-case.js'
import { UpdateExamPackageUseCase } from '../../application/use-cases/update-exam-package/update-exam-package.use-case.js'
import {
  CreateExamPackageDto,
  ExamPackageQueryDto,
  PackageCandidateQueryDto,
  UpdateExamPackageDto,
} from './dto/request/exam-package-request.dto.js'
import {
  ExamPackageDetailDto,
  ExamPackageListResponseDto,
  ExamPackageViewDto,
  PackageCandidateListResponseDto,
} from './dto/response/exam-package-response.dto.js'

@ApiTags('Exam Packages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exam-packages')
export class ExamPackageController {
  constructor(
    private readonly listPackages: ListExamPackagesUseCase,
    private readonly listCandidates: ListPackageCandidatesUseCase,
    private readonly getPackage: GetExamPackageUseCase,
    private readonly createPackage: CreateExamPackageUseCase,
    private readonly updatePackage: UpdateExamPackageUseCase,
    private readonly deletePackage: DeleteExamPackageUseCase,
    private readonly copyPackage: CopyExamPackageUseCase,
  ) {}

  @Get()
  @RequirePermissions('exam-packages.read')
  @ApiOperation({ summary: 'List exam packages' })
  @ApiResponse({ status: 200, type: ExamPackageListResponseDto })
  async findAll(
    @Query() query: ExamPackageQueryDto,
  ): Promise<ExamPackageListResponseDto> {
    return ExamPackageListResponseDto.fromDomain(
      await this.listPackages.execute(query),
    )
  }

  @Get('candidates')
  @RequirePermissions('exam-packages.create')
  @ApiOperation({
    summary:
      'Approved questions of a subject and grade a package may be built from',
  })
  @ApiResponse({ status: 200, type: PackageCandidateListResponseDto })
  async findCandidates(
    @Query() query: PackageCandidateQueryDto,
  ): Promise<PackageCandidateListResponseDto> {
    return PackageCandidateListResponseDto.fromDomain(
      await this.listCandidates.execute(query),
    )
  }

  @Get(':id')
  @RequirePermissions('exam-packages.read')
  @ApiOperation({
    summary: 'Get a package with every item from its pinned version',
  })
  @ApiResponse({ status: 200, type: ExamPackageViewDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExamPackageViewDto> {
    return ExamPackageViewDto.fromDomain(await this.getPackage.execute(id))
  }

  @Post()
  @RequirePermissions('exam-packages.create')
  @ApiOperation({ summary: 'Create a draft package from approved questions' })
  @ApiResponse({ status: 201, type: ExamPackageDetailDto })
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateExamPackageDto,
  ): Promise<ExamPackageDetailDto> {
    return ExamPackageDetailDto.fromDomain(
      await this.createPackage.execute(user, dto),
    )
  }

  @Patch(':id')
  @RequirePermissions('exam-packages.update')
  @ApiOperation({ summary: 'Replace the title and items of a draft package' })
  @ApiResponse({ status: 200, type: ExamPackageDetailDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExamPackageDto,
  ): Promise<ExamPackageDetailDto> {
    return ExamPackageDetailDto.fromDomain(
      await this.updatePackage.execute(id, dto),
    )
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('exam-packages.delete')
  @ApiOperation({ summary: 'Delete a draft package' })
  @ApiResponse({ status: 204 })
  @ApiParam({ name: 'id', format: 'uuid' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deletePackage.execute(id)
  }

  @Post(':id/copy')
  @RequirePermissions('exam-packages.create')
  @ApiOperation({ summary: 'Copy a package into a new draft' })
  @ApiResponse({ status: 201, type: ExamPackageDetailDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async copy(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExamPackageDetailDto> {
    return ExamPackageDetailDto.fromDomain(
      await this.copyPackage.execute(user, id),
    )
  }
}
