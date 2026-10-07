import { contentDisposition } from './content-disposition.js'

describe('contentDisposition', () => {
  it('shows a plain name inline', () => {
    expect(contentDisposition('inline', 'kk.pdf')).toBe(
      `inline; filename="kk.pdf"; filename*=UTF-8''kk.pdf`,
    )
  })

  it('forces a download when asked', () => {
    expect(contentDisposition('attachment', 'kk.pdf')).toMatch(
      /^attachment; filename="kk\.pdf"/,
    )
  })

  it('keeps a readable ASCII fallback and the exact UTF-8 name', () => {
    const header = contentDisposition('inline', 'Ijazah ñandú (SD).pdf')
    expect(header).toContain('filename="Ijazah _and_ (SD).pdf"')
    expect(header).toContain(
      "filename*=UTF-8''Ijazah%20%C3%B1and%C3%BA%20%28SD%29.pdf",
    )
  })

  it('cannot be used to inject a header or break out of the quotes', () => {
    const header = contentDisposition('inline', 'a"b\r\nSet-Cookie: x=1.pdf')
    expect(header).not.toMatch(/[\r\n]/)
    expect(header.match(/"/g)).toHaveLength(2)
    expect(header).toContain('%0D%0A')
  })
})
