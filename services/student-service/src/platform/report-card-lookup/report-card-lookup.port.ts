export interface ReportCardAverage {
  enrollmentId: string
  totalAverage: number | null
}

export abstract class IReportCardLookupPort {
  abstract findAveragesByEnrollmentIds(
    enrollmentIds: string[],
  ): Promise<ReportCardAverage[]>
}
