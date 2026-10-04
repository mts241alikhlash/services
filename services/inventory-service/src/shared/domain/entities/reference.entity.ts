export interface NamedRef {
  id: string
  name: string
}

export interface CodedRef extends NamedRef {
  code: string
}
