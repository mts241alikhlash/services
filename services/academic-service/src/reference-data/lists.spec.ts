import { SIMPLE_LISTS } from './lists.js'

describe('SIMPLE_LISTS', () => {
  const unique = (values: string[]) => new Set(values).size === values.length

  it('declares the seventeen reference lists', () => {
    expect(SIMPLE_LISTS).toHaveLength(17)
  })

  it('gives every list its own path, permission prefix, model and OpenAPI class name', () => {
    expect(unique(SIMPLE_LISTS.map((l) => l.path))).toBe(true)
    expect(unique(SIMPLE_LISTS.map((l) => l.permission))).toBe(true)
    expect(unique(SIMPLE_LISTS.map((l) => l.model))).toBe(true)
    expect(unique(SIMPLE_LISTS.map((l) => l.className))).toBe(true)
  })

  it('names the permission after the path', () => {
    for (const list of SIMPLE_LISTS) expect(list.permission).toBe(list.path)
  })

  it('checks usage before delete only for occupations', () => {
    expect(SIMPLE_LISTS.filter((l) => l.usage).map((l) => l.path)).toEqual([
      'occupations',
    ])
  })
})
