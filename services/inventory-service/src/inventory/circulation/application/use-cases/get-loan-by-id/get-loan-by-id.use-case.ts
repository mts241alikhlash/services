import { Injectable, NotFoundException } from '@nestjs/common'
import { ILoanRepository } from '../../../domain/repositories/loan.repository.js'

@Injectable()
export class GetLoanByIdUseCase {
  constructor(private readonly loanRepository: ILoanRepository) {}

  async execute(id: string) {
    const loan = await this.loanRepository.findLoanById(id)
    if (!loan) {
      throw new NotFoundException('Loan transaction not found.')
    }
    return loan
  }
}
