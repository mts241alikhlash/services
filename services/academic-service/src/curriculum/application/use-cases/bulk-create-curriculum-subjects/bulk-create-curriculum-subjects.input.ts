export interface BulkCreateCurriculumSubjectItemInput {
  curriculumId: string
  subjectId: string
  hoursPerWeek?: number
  passingScore?: number
}

export interface BulkCreateCurriculumSubjectsInput {
  items: BulkCreateCurriculumSubjectItemInput[]
}
