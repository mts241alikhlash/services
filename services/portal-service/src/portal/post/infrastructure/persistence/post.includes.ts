import { Prisma } from '@prisma/client'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import {
  PostAuthorRef,
  PostWithDetails,
} from '../../domain/entities/post.entity.js'

export const POST_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
  coverFile: { select: { id: true, storageKey: true, mimeType: true } },
  attachment: { select: { id: true, storageKey: true, mimeType: true } },
  tags: {
    select: { tag: { select: { id: true, name: true, slug: true } } },
    orderBy: { tag: { name: 'asc' } },
  },
} satisfies Prisma.PostInclude

export type PostRow = Prisma.PostGetPayload<{ include: typeof POST_INCLUDE }>

async function fetchAuthors(
  rows: PostRow[],
  profileLookupPort: IProfileLookupPort,
): Promise<Map<string, PostAuthorRef>> {
  const profiles = await profileLookupPort.findByUserIds(
    rows.map((row) => row.authorId),
  )
  return new Map(
    profiles.map((profile) => [
      profile.userId,
      {
        id: profile.userId,
        identifier: profile.identifier,
        profile: { name: profile.name },
      },
    ]),
  )
}

function fallbackAuthor(authorId: string): PostAuthorRef {
  return { id: authorId, identifier: '', profile: null }
}

export async function withAuthors(
  rows: PostRow[],
  profileLookupPort: IProfileLookupPort,
): Promise<PostWithDetails[]> {
  const authors = await fetchAuthors(rows, profileLookupPort)
  return rows.map((row) => ({
    ...row,
    author: authors.get(row.authorId) ?? fallbackAuthor(row.authorId),
  }))
}

export async function withAuthor(
  row: PostRow,
  profileLookupPort: IProfileLookupPort,
): Promise<PostWithDetails> {
  const [details] = await withAuthors([row], profileLookupPort)
  return details
}
