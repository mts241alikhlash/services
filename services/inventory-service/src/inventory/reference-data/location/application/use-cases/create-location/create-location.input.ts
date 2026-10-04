export interface CreateLocationInput {
  code: string
  name: string
  building?: string | null
  room?: string | null
  rack?: string | null
  description?: string | null
}
