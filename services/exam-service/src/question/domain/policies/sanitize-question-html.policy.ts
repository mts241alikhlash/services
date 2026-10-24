import sanitizeHtml from 'sanitize-html'

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'sub',
  'sup',
  'ol',
  'ul',
  'li',
  'span',
  'img',
  'blockquote',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
]

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
  '*': ['dir'],
  span: ['data-latex', 'dir'],
  img: ['data-file-id', 'alt'],
  th: ['colspan', 'rowspan'],
  td: ['colspan', 'rowspan'],
}

const FILE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu

export function sanitizeQuestionHtml(html: string): string {
  const clean = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: [],
    allowProtocolRelative: false,
    selfClosing: ['br', 'img'],
    disallowedTagsMode: 'discard',
    exclusiveFilter: (frame) =>
      frame.tag === 'img' && !FILE_ID.test(frame.attribs['data-file-id'] ?? ''),
  })
  return clean.trim()
}
