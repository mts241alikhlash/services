import { inlineToHtml, textToHtml } from './inline-latex.policy.js'

describe('textToHtml', () => {
  it('turns $...$ into a data-latex span', () => {
    expect(textToHtml('Hitung $x^2$ sekarang')).toBe(
      '<p dir="auto">Hitung <span data-latex="x^2">x^2</span> sekarang</p>',
    )
  })

  it('escapes markup, ampersands and quotes, also inside math', () => {
    expect(textToHtml('a < b & "c"')).toBe(
      '<p dir="auto">a &lt; b &amp; &quot;c&quot;</p>',
    )
    expect(textToHtml('$a"b$')).toBe(
      '<p dir="auto"><span data-latex="a&quot;b">a&quot;b</span></p>',
    )
  })

  it('writes one paragraph per line and drops blank lines', () => {
    expect(textToHtml('Satu\n\nDua\r\nTiga')).toBe(
      '<p dir="auto">Satu</p><p dir="auto">Dua</p><p dir="auto">Tiga</p>',
    )
    expect(textToHtml('   ')).toBe('')
  })

  it('keeps lone dollar signs and prices as text', () => {
    expect(textToHtml('Harga $5 dan $6')).toBe(
      '<p dir="auto">Harga $5 dan $6</p>',
    )
  })

  it('leaves Arabic with harakat untouched', () => {
    expect(textToHtml('مَا مَعْنَى كِتَابٌ؟')).toBe(
      '<p dir="auto">مَا مَعْنَى كِتَابٌ؟</p>',
    )
  })
})

describe('inlineToHtml', () => {
  it('converts math in already escaped html without escaping it again', () => {
    expect(inlineToHtml('Hasil $2+3$ &amp; lainnya')).toBe(
      'Hasil <span data-latex="2+3">2+3</span> &amp; lainnya',
    )
  })
})
