const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}

const MATH = /\$(?=\S)([^$\n]+?)(?<=\S)\$/gu

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/gu, (char) => ESCAPES[char] ?? char)
}

export function inlineToHtml(escaped: string): string {
  return escaped.replace(
    MATH,
    (_match, latex: string) =>
      `<span data-latex="${latex.replace(/"/gu, '&quot;')}">${latex}</span>`,
  )
}

export function textToHtml(text: string): string {
  return text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => `<p dir="auto">${inlineToHtml(escapeHtml(line))}</p>`)
    .join('')
}
