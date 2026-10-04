import { classroomDisplayName } from './classroom-display-name.helper.js'

describe('classroomDisplayName', () => {
  it('names the class by its code, which is the unique one', () => {
    expect(
      classroomDisplayName({
        code: 'VII-A',
        name: null,
        grade: { name: 'VII' },
      }),
    ).toBe('VII-A')
  })

  it('keeps the alias beside the code rather than instead of it', () => {
    expect(
      classroomDisplayName({
        code: 'VII-A',
        name: 'Awesome',
        grade: { name: 'VII' },
      }),
    ).toBe('VII-A (Awesome)')
  })

  it('never renders two classes of one grade identically', () => {
    const a = classroomDisplayName({ code: 'VII-A', grade: { name: 'VII' } })
    const b = classroomDisplayName({ code: 'VII-B', grade: { name: 'VII' } })
    expect(a).not.toBe(b)
  })

  it('falls back to grade and alias when a row predates the code', () => {
    expect(
      classroomDisplayName({ code: null, name: '2', grade: { name: 'VII' } }),
    ).toBe('VII 2')
    expect(classroomDisplayName({ code: '', grade: { name: 'VII' } })).toBe(
      'VII',
    )
  })

  it('returns an empty string rather than "undefined" when it knows nothing', () => {
    expect(classroomDisplayName({})).toBe('')
  })
})
