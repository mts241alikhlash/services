import {
  UNUSED_IMAGE_MIN_AGE_MS,
  findUnusedImages,
} from './landing-unused-images.policy.js'

const now = new Date('2026-10-09T12:00:00Z')
const old = new Date(now.getTime() - UNUSED_IMAGE_MIN_AGE_MS - 1000)
const fresh = new Date(now.getTime() - UNUSED_IMAGE_MIN_AGE_MS + 60_000)
const ref = (id: string) => ({ photo: { image: { imageId: id } } })

describe('findUnusedImages', () => {
  const images = [
    { id: 'a', createdAt: old },
    { id: 'b', createdAt: old },
    { id: 'c', createdAt: old },
    { id: 'd', createdAt: fresh },
  ]

  it('returns old images that no document references', () => {
    expect(findUnusedImages(images, [ref('a')], now)).toEqual(['b', 'c'])
  })

  it('keeps an image used by any document, published or draft', () => {
    expect(
      findUnusedImages(images, [ref('a'), { list: [ref('b')] }, null], now),
    ).toEqual(['c'])
  })

  it('keeps an image younger than the minimum age even if nothing references it', () => {
    expect(findUnusedImages(images, [], now)).toEqual(['a', 'b', 'c'])
  })

  it('returns nothing when everything is referenced', () => {
    expect(
      findUnusedImages(images, [ref('a'), ref('b'), ref('c'), ref('d')], now),
    ).toEqual([])
  })
})
