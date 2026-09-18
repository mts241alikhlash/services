import { Injectable } from '@nestjs/common'
import { ILoanRepository } from '../../../domain/repositories/loan.repository.js'
import { GetLoansInput } from './get-loans.input.js'

@Injectable()
export class GetLoansUseCase {
  constructor(private readonly loanRepository: ILoanRepository) {}

  async execute(input: GetLoansInput) {
    return this.loanRepository.findAllLoans({
      page: input.page,
      limit: input.limit,
      keyword: input.keyword,
      statusId: input.statusId,
      requesterId: input.requesterId,
    })
  }
}
