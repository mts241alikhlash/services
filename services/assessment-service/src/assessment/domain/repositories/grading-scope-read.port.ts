export abstract class IGradingScopeReadPort {
  abstract teachesAssessmentItem(
    employeeId: string,
    assessmentItemId: string,
  ): Promise<boolean>

  abstract supervisesEnrollment(
    employeeId: string,
    enrollmentId: string,
  ): Promise<boolean>
}
