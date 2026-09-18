import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import { pgSslOptions } from '../src/core/database/pg-ssl.js'
import { seedIam } from './seeds/modules/iam.seed.js'

const connectionString =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? ''
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
    ...pgSslOptions(connectionString),
  }),
})

async function main() {
  console.log('\n=== Resetting the built-in roles to the code baseline ===\n')
  await seedIam(prisma)

  const roles = await prisma.role.findMany({
    where: {
      code: {
        in: [
          'SUPER_ADMIN',
          'ADMIN',
          'TEACHER',
          'STUDENT',
          'PARENT',
          'PRINCIPAL',
        ],
      },
    },
    select: { code: true, _count: { select: { rolePermissions: true } } },
    orderBy: { code: 'asc' },
  })

  console.log('\nGrants now held:')
  for (const role of roles) {
    console.log(`  ${role.code.padEnd(12)} ${role._count.rolePermissions}`)
  }
}

main()
  .catch((e) => {
    console.error('\n✗ Reset failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
