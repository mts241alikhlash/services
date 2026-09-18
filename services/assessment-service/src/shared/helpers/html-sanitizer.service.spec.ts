import { HtmlSanitizerService } from './html-sanitizer.service.js'

describe('HtmlSanitizerService', () => {
  let service: HtmlSanitizerService

  beforeEach(() => {
    service = new HtmlSanitizerService()
  })

  describe('sanitize', () => {
    it('returns empty string when given empty input', () => {
      expect(service.sanitize('')).toBe('')
    })

    it('removes inline event handlers from images', () => {
      const result = service.sanitize(
        '<img src="https://x.test/a.jpg" alt="a" onerror="alert(1)" />',
      )
      expect(result).not.toContain('onerror')
      expect(result).toContain('src="https://x.test/a.jpg"')
    })

    it('strips javascript: URLs from links', () => {
      const result = service.sanitize('<a href="javascript:alert(1)">klik</a>')
      expect(result).not.toContain('javascript:')
      expect(result).toContain('klik')
    })

    it('strips javascript: URLs from image sources', () => {
      const result = service.sanitize(
        '<img src="javascript:alert(1)" alt="x" />',
      )
      expect(result).not.toContain('javascript:')
    })

    it('strips dangerous tags like iframe, script, and object', () => {
      const result = service.sanitize(
        '<iframe src="https://evil.test"></iframe><p>sisa</p>',
      )
      expect(result).not.toContain('<iframe')
      expect(result).toContain('<p>sisa</p>')
    })

    it('strips inline style tags completely', () => {
      const result = service.sanitize(
        '<style>body{display:none}</style><p>konten</p>',
      )
      expect(result).not.toContain('display:none')
    })

    it('escapes quotes so an attribute payload cannot break out', () => {
      const result = service.sanitize(
        '<a href="https://x.test" title="&quot;onmouseover=&quot;alert(1)">t</a>',
      )
      expect(result).toContain('&quot;')
      expect(result).not.toMatch(/"\s*onmouseover/)
    })
  })

  describe('formatting preservation', () => {
    it('preserves headings except h1', () => {
      const html = '<h2>Judul 2</h2><h3>Judul 3</h3><h4>Judul 4</h4>'
      expect(service.sanitize(html)).toBe(html)
    })

    it('demotes or strips h1 tag', () => {
      const result = service.sanitize('<h1>Judul Utama</h1>')
      expect(result).not.toContain('<h1')
      expect(result).toContain('Judul Utama')
    })

    it('preserves text formatting tags', () => {
      const html =
        '<p><strong>Tebal</strong> <em>Miring</em> <u>Garis</u> <s>Coret</s></p>'
      expect(service.sanitize(html)).toBe(html)
    })

    it('preserves lists and blockquotes', () => {
      const html =
        '<ul><li>Satu</li><li>Dua</li></ul><blockquote>Kutipan</blockquote>'
      expect(service.sanitize(html)).toBe(html)
    })

    it('preserves links and images with valid URLs', () => {
      const html =
        '<p><a href="https://mts241.test/berita">tautan</a></p>' +
        '<img src="https://mts241.test/a.webp" alt="Foto kegiatan" />'
      const result = service.sanitize(html)
      expect(result).toContain('href="https://mts241.test/berita"')
      expect(result).toContain('src="https://mts241.test/a.webp"')
    })

    it('preserves tables with attributes', () => {
      const html =
        '<table><thead><tr><th colspan="2">Header</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>'
      expect(service.sanitize(html)).toBe(html)
    })

    it('adds rel="noopener noreferrer" to links', () => {
      const result = service.sanitize('<a href="https://x.test">t</a>')
      expect(result).toContain('rel="noopener noreferrer"')
    })
  })

  describe('edge cases', () => {
    it('handles nested malicious payload inside valid tags', () => {
      const dirty = '<div><p>Aman <script>alert("xss")</script>lagi</p></div>'
      const result = service.sanitize(dirty)
      expect(result).not.toContain('<script')
      expect(result).not.toContain('alert')
      expect(result).toContain('Aman')
      expect(result).toContain('lagi')
    })

    it('handles mixed content with multiple attack vectors', () => {
      const dirty =
        '<p>Halo</p><script>alert(1)</script><a href="https://x.test">t</a>'
      const result = service.sanitize(dirty)
      expect(result).toContain('<p>Halo</p>')
      expect(result).not.toContain('<script')
      expect(result).toContain('<a href="https://x.test"')
    })
  })
})
