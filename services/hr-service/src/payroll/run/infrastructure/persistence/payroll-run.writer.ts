import { Prisma } from '@prisma/client'
import { ComposedPayslip } from '../../domain/entities/payslip.entity.js'

type Tx = Prisma.TransactionClient

export async function writePayslips(
  tx: Tx,
  payrollRunId: string,
  payslips: ComposedPayslip[],
): Promise<void> {
  for (const payslip of payslips) {
    const created = await tx.payslip.create({
      data: {
        payrollRunId,
        userId: payslip.userId,
        grossAmount: payslip.gross,
        deductionAmount: payslip.deductions,
        netAmount: payslip.net,
        ...payslip.attendance,
      },
      select: { id: true },
    })

    if (payslip.lines.length === 0) continue

    await tx.payslipLine.createMany({
      data: payslip.lines.map((line) => ({
        payslipId: created.id,
        componentId: line.componentId,
        componentCode: line.componentCode,
        componentName: line.componentName,
        componentType: line.componentType,
        amount: line.amount,
        driver: line.driver,
        driverCount: line.driverCount,
        rate: line.rate,
      })),
    })
  }
}

export async function clearPayslips(
  tx: Tx,
  payrollRunId: string,
): Promise<void> {
  await tx.payslip.deleteMany({ where: { payrollRunId } })
}
