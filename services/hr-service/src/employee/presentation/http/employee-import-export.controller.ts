import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import {
  Body,
  Controller,
  Get,
  ParseFilePipe,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

import { JwtAuthGuard } from '../../../platform/auth/index.js'

import { BulkImportEmployeesResponseDto } from './dto/response/bulk-import-employee-response.dto.js'
import { ExportEmployeeQueryDto } from './dto/request/export-employee-query.dto.js'
import { ResolveBulkImportConflictsDto } from './dto/request/resolve-bulk-import-conflicts.dto.js'
import { ResolveBulkImportResponseDto } from './dto/response/resolve-bulk-import-response.dto.js'
import { BulkImportEmployeesUseCase } from '../../application/use-cases/bulk-import-employee/bulk-import-employee.use-case.js'
import { ResolveBulkImportConflictsUseCase } from '../../application/use-cases/resolve-bulk-import-conflicts/resolve-bulk-import-conflicts.use-case.js'
import { ExportEmployeesUseCase } from '../../application/use-cases/export-employee/export-employee.use-case.js'

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeeImportExportController {
  constructor(
    private readonly bulkImportEmployeesUseCase: BulkImportEmployeesUseCase,
    private readonly resolveBulkImportConflictsUseCase: ResolveBulkImportConflictsUseCase,
    private readonly exportEmployeesUseCase: ExportEmployeesUseCase,
  ) {}

  @Get('export')
  @RequirePermissions('employees.read')
  @ApiOperation({ summary: 'Export employees to Excel (.xlsx)' })
  @ApiResponse({
    status: 200,
    description: 'Returns an Excel file as attachment',
    headers: {
      'Content-Disposition': {
        description: 'attachment; filename="employees.xlsx"',
        schema: { type: 'string' },
      },
    },
  })
  async export(
    @Query() query: ExportEmployeeQueryDto,
  ): Promise<StreamableFile> {
    const buffer = await this.exportEmployeesUseCase.execute(query)
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="employees.xlsx"',
    })
  }

  @Get('import-template')
  @RequirePermissions('employees.read')
  @ApiOperation({
    summary: 'Download blank import template (.xlsx) for employees',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a blank Excel template file',
    headers: {
      'Content-Disposition': {
        description: 'attachment; filename="template_import_pegawai.xlsx"',
        schema: { type: 'string' },
      },
    },
  })
  async downloadImportTemplate(): Promise<StreamableFile> {
    const buffer = await this.exportEmployeesUseCase.buildImportTemplate()
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="template_import_pegawai.xlsx"',
    })
  }

  @Post('bulk-import')
  @RequirePermissions('employees.create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Preview an employee import file (.xlsx): reports per row what would happen, and writes nothing. Post the result to bulk-import/resolve to apply it',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, type: BulkImportEmployeesResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid file or empty sheet' })
  async bulkImport(
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
    file: Express.Multer.File,
  ): Promise<BulkImportEmployeesResponseDto> {
    return this.bulkImportEmployeesUseCase.execute(file.buffer)
  }

  @Post('bulk-import/resolve')
  @RequirePermissions('employees.create', 'employees.update')
  @ApiOperation({
    summary:
      'Apply a previewed bulk import: create the new rows, and update or skip each conflicting one as the caller decided',
  })
  @ApiResponse({ status: 201, type: ResolveBulkImportResponseDto })
  async resolveBulkImportConflicts(
    @Body() dto: ResolveBulkImportConflictsDto,
  ): Promise<ResolveBulkImportResponseDto> {
    return this.resolveBulkImportConflictsUseCase.execute(dto)
  }
}
