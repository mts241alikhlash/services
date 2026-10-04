import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common'
import { IAttendancePeriodReadPort } from '../../../platform/presence-lookup/presence-lookup.port.js'
import { RUN_MESSAGES } from '../constants/payroll-run.constants.js'
import {
  PayrollRunKindEnum,
  PayrollRunWithTotals,
} from '../domain/entities/payroll-run.entity.js'
import { IPayrollRunRepository } from '../domain/interfaces/payroll-run-repository.interface.js'
import { CreatePayrollRunDto } from '../dto/request/create-payroll-run.dto.js'
import { PayrollRosterService } from '../services/payroll-roster.service.js'
import { PayslipComposerService } from '../services/payslip-composer.service.js'

@Injectable()
export class CreatePayrollRunUseCase {
  constructor(
    private readonly runs: IPayrollRunRepository,
    private readonly periods: IAttendancePeriodReadPort,
    private readonly roster: PayrollRosterService,
    private readonly composer: PayslipComposerService,
  ) {}

  async execute(
    dto: CreatePayrollRunDto,
    createdBy: string,
  ): Promise<PayrollRunWithTotals> {
    const { year, month } = dto
    const kind: PayrollRunKindEnum = dto.kind ?? 'ORIGINAL'

    if (!(await this.periods.isClosed(year, month))) {
      throw new ConflictException(RUN_MESSAGES.PERIOD_NOT_CLOSED)
    }

    await this.assertKindIsAvailable(year, month, kind)

    const employees = await this.roster.list()
    if (employees.length === 0) {
      throw new UnprocessableEntityException(RUN_MESSAGES.EMPTY_ROSTER)
    }

    const { payslips, unconfigured } = await this.composer.compose(
      employees.map((employee) => employee.userId),
      year,
      month,
    )

    if (unconfigured.length > 0) {
      throw new UnprocessableEntityException({
        message: 'The following employees have no salary components',
        employees: this.roster.name(employees, unconfigured),
      })
    }

    return this.runs.create({
      year,
      month,
      kind,
      sequence: await this.runs.nextSequence(year, month, kind),
      note: dto.note ?? null,
      createdBy,
      payslips,
    })
  }

  private async assertKindIsAvailable(
    year: number,
    month: number,
    kind: PayrollRunKindEnum,
  ): Promise<void> {
    const original = await this.runs.findByPeriod(year, month, 'ORIGINAL')

    if (kind === 'ORIGINAL' && original) {
      throw new ConflictException(RUN_MESSAGES.ORIGINAL_EXISTS)
    }
    if (kind === 'ADJUSTMENT' && !original) {
      throw new ConflictException(RUN_MESSAGES.ORIGINAL_MISSING)
    }
  }
}
