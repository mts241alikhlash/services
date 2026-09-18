import { ParentRelation } from '../../../../shared/domain/enums/parent-relation.enum.js'

export interface UpdateStudentParentInput {
  parentId?: string
  relation?: ParentRelation
  isPrimary?: boolean
}
