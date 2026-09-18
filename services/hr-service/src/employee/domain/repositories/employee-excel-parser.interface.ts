import { EmployeeImportRow } from '../entities/employee-import-row.entity.js'

export abstract class ExcelEmployeeParser {
  abstract parse(buffer: Buffer): Promise<EmployeeImportRow[]>
}
