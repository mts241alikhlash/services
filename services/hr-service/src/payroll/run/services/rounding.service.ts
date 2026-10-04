import { Injectable } from '@nestjs/common'

@Injectable()
export class RoundingService {
  toRupiah(value: string | number): number {
    const numeric = typeof value === 'string' ? Number(value) : value
    if (!Number.isFinite(numeric)) return 0

    return Math.round(numeric)
  }

  driven(rate: string | null, count: number): number {
    if (rate === null) return 0
    return this.toRupiah(Number(rate) * count)
  }

  total(lines: { componentType: string; amount: number }[]): {
    gross: number
    deductions: number
    net: number
  } {
    let gross = 0
    let deductions = 0

    for (const line of lines) {
      if (line.componentType === 'DEDUCTION') {
        deductions += line.amount
      } else {
        gross += line.amount
      }
    }

    return { gross, deductions, net: gross - deductions }
  }

  format(value: number): string {
    return String(Math.round(value))
  }
}
