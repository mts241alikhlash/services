export class InvalidSemesterError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidSemesterError'
  }
}
