export interface RegisterApplicantInput {
  fullName: string
  email: string
  phone?: string
  password: string
  passwordConfirm: string
  waveId?: string
}
