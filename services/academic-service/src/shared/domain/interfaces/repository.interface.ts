export interface PaginatedResult<T, TSummary = never> {
  data: T[]
  total: number
  page: number
  limit: number
  summary?: TSummary
}

export interface PaginationQueryInput {
  page?: number
  limit?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}
