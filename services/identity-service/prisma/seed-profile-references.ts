import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import { pgSslOptions } from '../src/core/database/pg-ssl.js'
import { seedProfileReferences } from './seeds/modules/profile-reference.seed.js'

async function main() {
  const connectionString =
    process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? ''
  const adapter = new PrismaPg({
    connectionString,
    ...pgSslOptions(connectionString),
  })
  const prisma = new PrismaClient({ adapter })

  try {
    await seedProfileReferences(prisma)
  } finally {
    await prisma.$disconnect()
  }
}

void main()
