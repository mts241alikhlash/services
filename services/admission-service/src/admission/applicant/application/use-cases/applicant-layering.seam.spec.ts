import {
  ApplicantModule,
  GetMyApplicationUseCase,
  RegisterApplicantUseCase,
  SubmitApplicationUseCase,
  UpdateMyApplicationUseCase,
} from '../../index.js'

describe('Applicant public API', () => {
  it('exposes applicant module and four applicant operations', () => {
    expect(ApplicantModule).toBeDefined()
    expect(RegisterApplicantUseCase).toBeDefined()
    expect(GetMyApplicationUseCase).toBeDefined()
    expect(UpdateMyApplicationUseCase).toBeDefined()
    expect(SubmitApplicationUseCase).toBeDefined()
  })
})
