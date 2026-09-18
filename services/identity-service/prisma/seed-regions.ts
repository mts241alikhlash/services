import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import { pgSslOptions } from '../src/core/database/pg-ssl.js'
import { seedRegions } from './seeds/modules/region.seed.js'

const file = process.env.SEED_REGIONS_FILE

async function main() {
  if (!file) {
    throw new Error(
      'SEED_REGIONS_FILE is not set. Point it at wilayah.sql from ' +
        'https://github.com/cahyadsn/wilayah (Kepmendagri 300.2.2-2430/2025), ' +
        'or at any file of "code,name" lines.',
    )
  }

  const connectionString =
    process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? ''
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      ...pgSslOptions(connectionString),
    }),
  })

  console.log(`\n=== Administrative areas: ${file} ===\n`)

  try {
    await seedRegions(prisma, file)
  } finally {
    await prisma.$disconnect()
  }

  console.log('')
}

main().catch((e) => {
  console.error('\n✗ Region seed failed:', e)
  process.exit(1)
})
