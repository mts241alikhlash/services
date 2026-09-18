import { Injectable } from '@nestjs/common'
import { IAttendancePeriodRepository } from '../../attendance-period/domain/interfaces/attendance-period-repository.interface.js'
import {
  PresenceRecap,
  RecapQueryInput,
} from '../domain/interfaces/daily-presence-recap.interface.js'
import { IDailyPresenceRepository } from '../domain/interfaces/daily-presence-repository.interface.js'

@Injectable()
export class GetPresenceRecapUseCase {
  constructor(
    private readonly dailyPresence: IDailyPresenceRepository,
    private readonly periods: IAttendancePeriodRepository,
  ) {}

  async execute(query: RecapQueryInput): Promise<PresenceRecap> {
    const [rows, workingDays, period] = await Promise.all([
      this.dailyPresence.getRecap(query),
      this.dailyPresence.countWorkingDays(query.year, query.month),
      this.periods.findByPeriod(query.year, query.month),
    ])

    return {
      period: {
        year: query.year,
        month: query.month,
        status: period?.status === 'CLOSED' ? 'CLOSED' : 'OPEN',
        workingDays,
      },
      rows,
    }
  }
}

export interface RecapExportRow {
  Nama: string
  Hadir: number
  Alpa: number
  Terlambat: number
  'Menit Terlambat': number
  'Pulang Cepat': number
  Izin: number
  'Dinas Luar': number
  'Persentase Kehadiran': number
}

@Injectable()
export class ExportPresenceRecapUseCase {
  constructor(private readonly recap: GetPresenceRecapUseCase) {}

  async execute(query: RecapQueryInput): Promise<RecapExportRow[]> {
    const { rows } = await this.recap.execute(query)

    return rows.map((row) => ({
      Nama: row.displayName ?? '—',
      Hadir: row.presentDays,
      Alpa: row.absentDays,
      Terlambat: row.lateCount,
      'Menit Terlambat': row.lateMinutes,
      'Pulang Cepat': row.earlyLeaveCount,
      Izin: row.leaveDays,
      'Dinas Luar': row.officialDutyDays,
      'Persentase Kehadiran': row.attendanceRate,
    }))
  }
}
