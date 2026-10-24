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

export function sanitizeQuestionHtml(html: string): string {
  const clean = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: [],
    allowProtocolRelative: false,
    selfClosing: ['br', 'img'],
    disallowedTagsMode: 'discard',
  })
  return clean.trim()
}
