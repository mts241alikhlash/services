export class InvalidAcademicSettingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidAcademicSettingError'
  }
}
