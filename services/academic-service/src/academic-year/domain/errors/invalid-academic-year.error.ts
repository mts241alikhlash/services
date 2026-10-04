export class InvalidAcademicYearError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidAcademicYearError'
  }
}
