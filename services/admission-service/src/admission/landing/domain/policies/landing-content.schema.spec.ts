import { BadRequestException } from '@nestjs/common'
import {
  collectImageIds,
  parseLandingSection,
} from './landing-content.schema.js'

const uuid = '3f1c1b7e-5a53-4c0e-9f6a-2d3b8f1a9c11'
const image = { imageId: uuid }
const builtIn = { src: '/hero/baiat.webp' }

const hero = {
  eyebrow: 'Penerimaan Santri Baru · MTs Persis 241 Al-Ikhlash',
  titleLines: ['Di sini, cerita', 'barumu dimulai.'],
  description: 'Kenali lingkungan belajarmu.',
  registerLabel: 'Mulai pendaftaran',
  guideLabel: 'Lihat cara mendaftar',
  exploreLabel: 'Mengenal lebih dekat',
  photoNoteLines: ['Awal langkah.', 'Banyak cerita.'],
  schoolPhoto: {
    image: builtIn,
    alt: 'Santri berbaris',
    caption: 'Bai’at santri',
  },
  studyPhoto: {
    image: image,
    alt: 'Santri menghafal',
    title: 'Tahfidz',
    tag: 'Program unggulan',
  },
}

const life = {
  label: 'Mengenal',
  titleLines: ['Ada cerita', 'di setiap sudutnya.'],
  description: 'Lihat suasana.',
  footnote: 'Setiap perjalanan dimulai dengan mengenal.',
  linkLabel: 'Lihat jadwal',
  photos: [
    {
      image: builtIn,
      alt: 'Bai’at',
      title: 'Bai’at',
      caption: 'Upacara rutin.',
    },
  ],
}

const info = {
  title: 'Informasi PPDB',
  description: 'Poster.',
  posters: [{ image, alt: 'Poster jadwal', caption: null }],
}

const steps = {
  title: 'Tahapan pendaftaran',
  description: 'Lima langkah.',
  items: [1, 2, 3].map((n) => ({ title: `Langkah ${n}`, description: 'Isi.' })),
}

const faq = {
  title: 'Pertanyaan',
  description: 'Jawaban.',
  items: [{ question: 'Bagaimana?', answer: 'Begini.' }],
}

const stories = {
  label: 'Cerita',
  title: 'Dengar langsung',
  description: 'Kisah.',
  items: [
    {
      kind: 'Cerita alumni',
      quote: 'Bagus.',
      name: 'Ani',
      position: null,
      tags: ['Alumni'],
      photo: null,
    },
  ],
}

const closing = {
  title: 'Sampai bertemu.',
  description: 'Mulai dengan satu akun.',
  registerLabel: 'Mulai pendaftaran',
  requirementsLabel: 'Periksa persyaratan',
  photo: { image: builtIn, alt: 'Orang tua santri' },
}

const valid = { hero, life, info, steps, faq, stories, closing }

describe('parseLandingSection', () => {
  it.each(Object.keys(valid))('accepts a valid %s document', (key) => {
    expect(parseLandingSection(key, valid[key as keyof typeof valid])).toEqual(
      valid[key as keyof typeof valid],
    )
  })

  it('trims texts and turns a blank caption into null', () => {
    const parsed = parseLandingSection('info', {
      ...info,
      title: '  Informasi PPDB  ',
      posters: [{ image, alt: ' Poster ', caption: '   ' }],
    }) as typeof info
    expect(parsed.title).toBe('Informasi PPDB')
    expect(parsed.posters[0]).toEqual({ image, alt: 'Poster', caption: null })
  })

  it('refuses an unknown section', () => {
    expect(() => parseLandingSection('footer', {})).toThrow(
      new BadRequestException('Bagian halaman depan tidak dikenal'),
    )
  })

  it.each([
    ['an empty required text', 'hero', { ...hero, eyebrow: '   ' }],
    [
      'a text over its limit',
      'hero',
      { ...hero, description: 'x'.repeat(301) },
    ],
    ['no title lines', 'hero', { ...hero, titleLines: [] }],
    ['four title lines', 'hero', { ...hero, titleLines: ['a', 'b', 'c', 'd'] }],
    ['an extra field', 'hero', { ...hero, extra: true }],
    ['a missing photo', 'closing', { ...closing, photo: undefined }],
    [
      'an unlisted built-in src',
      'closing',
      { ...closing, photo: { image: { src: '/etc/passwd' }, alt: 'x' } },
    ],
    [
      'a src that is not webp',
      'closing',
      { ...closing, photo: { image: { src: '/hero/a.png' }, alt: 'x' } },
    ],
    [
      'an image that is not a uuid',
      'closing',
      { ...closing, photo: { image: { imageId: 'abc' }, alt: 'x' } },
    ],
    [
      'an image reference with both keys',
      'closing',
      {
        ...closing,
        photo: { image: { imageId: uuid, src: '/hero/a.webp' }, alt: 'x' },
      },
    ],
    ['a missing alt', 'closing', { ...closing, photo: { image: builtIn } }],
    ['no life photos', 'life', { ...life, photos: [] }],
    [
      'thirteen life photos',
      'life',
      { ...life, photos: Array.from({ length: 13 }, () => life.photos[0]) },
    ],
    [
      'eleven posters',
      'info',
      { ...info, posters: Array.from({ length: 11 }, () => info.posters[0]) },
    ],
    ['two steps', 'steps', { ...steps, items: steps.items.slice(0, 2) }],
    [
      'six steps',
      'steps',
      { ...steps, items: Array.from({ length: 6 }, () => steps.items[0]) },
    ],
    ['no questions', 'faq', { ...faq, items: [] }],
    [
      'sixteen questions',
      'faq',
      { ...faq, items: Array.from({ length: 16 }, () => faq.items[0]) },
    ],
    [
      'nine stories',
      'stories',
      { ...stories, items: Array.from({ length: 9 }, () => stories.items[0]) },
    ],
    [
      'a placeholder flag on a story',
      'stories',
      { ...stories, items: [{ ...stories.items[0], placeholder: true }] },
    ],
    [
      'four tags',
      'stories',
      {
        ...stories,
        items: [{ ...stories.items[0], tags: ['a', 'b', 'c', 'd'] }],
      },
    ],
    ['not an object', 'faq', 'text'],
  ])('refuses %s', (_name, key, input) => {
    expect(() => parseLandingSection(key, input)).toThrow(BadRequestException)
  })

  it('allows an empty poster list and an empty story list', () => {
    expect(() =>
      parseLandingSection('info', { ...info, posters: [] }),
    ).not.toThrow()
    expect(() =>
      parseLandingSection('stories', { ...stories, items: [] }),
    ).not.toThrow()
  })

  it('names the failing field in the message', () => {
    try {
      parseLandingSection('hero', { ...hero, registerLabel: '' })
      fail('should have thrown')
    } catch (error) {
      expect((error as BadRequestException).message).toContain('registerLabel')
    }
  })
})

describe('collectImageIds', () => {
  it('finds every uploaded image and ignores built-in photos', () => {
    const other = '7d0a5f6e-3b1c-4e2d-8a9f-0c1d2e3f4a5b'
    const doc = parseLandingSection('hero', hero)
    expect(collectImageIds(doc)).toEqual([uuid])
    expect(
      collectImageIds({
        photos: [
          { image: { imageId: uuid } },
          { image: { imageId: other } },
          { image: builtIn },
        ],
      }),
    ).toEqual([uuid, other])
    expect(collectImageIds(null)).toEqual([])
    expect(collectImageIds('text')).toEqual([])
  })
})
