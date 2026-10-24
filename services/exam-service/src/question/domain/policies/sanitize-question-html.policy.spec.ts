import { sanitizeQuestionHtml } from './sanitize-question-html.policy.js'

describe('sanitizeQuestionHtml', () => {
  it('removes scripts, event handlers, links and foreign images', () => {
    const dirty =
      '<p onclick="x()">Halo<script>alert(1)</script></p>' +
      '<a href="javascript:alert(1)">klik</a>' +
      '<img src="http://evil.example/a.png" onerror="x()" data-file-id="f1">' +
      '<img src="http://evil.example/b.png">'

    const clean = sanitizeQuestionHtml(dirty)

    expect(clean).not.toContain('script')
    expect(clean).not.toContain('onclick')
    expect(clean).not.toContain('javascript')
    expect(clean).not.toContain('evil.example')
    expect(clean).not.toContain('onerror')
    expect(clean).toContain('<img data-file-id="f1" />')
    expect(clean).toContain('klik')
  })

  it('keeps math, image references and text direction', () => {
    const html =
      '<p dir="auto">Hitung <span data-latex="\\frac{1}{2}">\\frac{1}{2}</span></p>' +
      '<img data-file-id="3d2a9b2e" alt="Grafik" />'

    expect(sanitizeQuestionHtml(html)).toBe(
      '<p dir="auto">Hitung <span data-latex="\\frac{1}{2}">\\frac{1}{2}</span></p>' +
        '<img data-file-id="3d2a9b2e" alt="Grafik" />',
    )
  })

  it('keeps Arabic text with harakat unchanged', () => {
    const html = '<p dir="auto">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ</p>'

    expect(sanitizeQuestionHtml(html)).toBe(html)
  })

  it('keeps basic formatting and tables', () => {
    const html =
      '<p><strong>Tebal</strong> <em>miring</em> H<sub>2</sub>O x<sup>2</sup></p>' +
      '<ol><li>satu</li></ol><table><tbody><tr><td colspan="2">sel</td></tr></tbody></table>'

    expect(sanitizeQuestionHtml(html)).toBe(html)
  })

  it('returns an empty string for blank input', () => {
    expect(sanitizeQuestionHtml('   ')).toBe('')
  })
})
