import {
  SubjectItemResponseDto,
  SubjectPageResponseDto,
  SubjectRecordResponseDto,
} from './dto/response/subject-api-response.dto.js'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
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

import { JwtAuthGuard } from '../../../platform/auth/index.js'

import { SubjectQueryDto } from './dto/request/subject-query.dto.js'
import { CreateSubjectDto } from './dto/request/create-subject.dto.js'
import { UpdateSubjectDto } from './dto/request/update-subject.dto.js'
import { CreateSubjectUseCase } from '../../application/use-cases/create-subject/create-subject.use-case.js'
import { DeleteSubjectUseCase } from '../../application/use-cases/delete-subject/delete-subject.use-case.js'
import { GetSubjectByIdUseCase } from '../../application/use-cases/get-subject-by-id/get-subject-by-id.use-case.js'
import { GetSubjectsUseCase } from '../../application/use-cases/get-subjects/get-subjects.use-case.js'
import { UpdateSubjectUseCase } from '../../application/use-cases/update-subject/update-subject.use-case.js'

@ApiTags('Subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subjects')
export class SubjectController {
  constructor(
    private readonly getSubjectsService: GetSubjectsUseCase,
    private readonly getSubjectByIdService: GetSubjectByIdUseCase,
    private readonly createSubjectService: CreateSubjectUseCase,
    private readonly updateSubjectService: UpdateSubjectUseCase,
    private readonly deleteSubjectService: DeleteSubjectUseCase,
  ) {}

  @Get()
  @RequirePermissions('subjects.read')
  @ApiOperation({ summary: 'List all subjects (paginated, searchable)' })
  @ApiResponse({ status: 200, type: SubjectPageResponseDto })
  async findAll(
    @Query() query: SubjectQueryDto,
  ): Promise<SubjectPageResponseDto> {
    return SubjectPageResponseDto.fromDomain(
      await this.getSubjectsService.execute(query),
    )
  }

  @Get(':id')
  @RequirePermissions('subjects.read')
  @ApiOperation({ summary: 'Get a subject by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: SubjectItemResponseDto })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SubjectItemResponseDto> {
    return SubjectItemResponseDto.fromDomain(
      await this.getSubjectByIdService.execute(id),
    )
  }

  @Post()
  @RequirePermissions('subjects.create')
  @ApiOperation({ summary: 'Create a subject' })
  @ApiResponse({ status: 201, type: SubjectRecordResponseDto })
  @ApiResponse({ status: 409, description: 'Duplicate subject name' })
  async create(
    @Body() dto: CreateSubjectDto,
  ): Promise<SubjectRecordResponseDto> {
    return SubjectRecordResponseDto.fromDomain(
      await this.createSubjectService.execute(dto),
    )
  }

  @Patch(':id')
  @RequirePermissions('subjects.update')
  @ApiOperation({ summary: 'Update a subject' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: SubjectRecordResponseDto })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  @ApiResponse({ status: 409, description: 'Duplicate subject name' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubjectDto,
  ): Promise<SubjectRecordResponseDto> {
    return SubjectRecordResponseDto.fromDomain(
      await this.updateSubjectService.execute(id, dto),
    )
  }

  @Delete(':id')
  @RequirePermissions('subjects.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subject (hard delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Subject deleted' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteSubjectService.execute(id)
  }
}
