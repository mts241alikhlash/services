export interface StatusLookupOutput {
  id: string
}

export abstract class IStatusLookupPort {
  abstract findBySystemKey(key: string): Promise<StatusLookupOutput | null>
}
