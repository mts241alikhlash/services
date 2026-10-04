export const OPTION_LISTS = {
  occupations: 'occupations',
  educations: 'educations',
  incomeRanges: 'income-ranges',
  financingSources: 'financing-sources',
  disabilityTypes: 'disability-types',
  specialNeeds: 'special-needs',
  studentResidences: 'student-residences',
  parentResidences: 'parent-residences',
  transportations: 'transportations',
  travelDistances: 'travel-distances',
  travelTimes: 'travel-times',
  parentLifeStatuses: 'parent-life-statuses',
  domiciles: 'domiciles',
  scholarshipCategories: 'scholarship-categories',
  scholarshipProviderTypes: 'scholarship-provider-types',
  competitionFields: 'competition-fields',
  competitionLevels: 'competition-levels',
} as const

export type OptionListKey = keyof typeof OPTION_LISTS

export interface OptionRef {
  id: string
  name: string
  isActive: boolean
}
