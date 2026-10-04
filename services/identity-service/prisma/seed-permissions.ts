import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'
import 'dotenv/config'
import { pgSslOptions } from '../src/core/database/pg-ssl.js'
import { syncPermissions } from './seeds/modules/permission-sync.seed.js'

const connectionString =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? ''
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
    ...pgSslOptions(connectionString),
  }),
})

syncPermissions(prisma)
  .catch((error) => {
    console.error('\n✗ Permission sync failed:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
