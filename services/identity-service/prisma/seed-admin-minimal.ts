import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, UserGender } from '../src/generated/prisma/client.js'
import * as bcrypt from 'bcrypt'
import 'dotenv/config'
import { pgSslOptions } from '../src/core/database/pg-ssl.js'
import { syncPermissions } from './seeds/modules/permission-sync.seed.js'

const adminPassword = process.env.SEED_ADMIN_PASSWORD
if (!adminPassword || adminPassword.length < 12) {
  throw new Error('SEED_ADMIN_PASSWORD is required, at least 12 characters')
}
const resetPassword = process.env.SEED_ADMIN_RESET_PASSWORD === 'true'

const ADMIN = {
  username: 'admin',
  password: adminPassword,
  name: 'Administrator',
  nik: '0000000000000001',
  gender: UserGender.MALE,
  birthPlace: 'Bandung',
  birthDate: new Date('1980-01-01'),
  email: 'admin@mts241alikhlash.sch.id',
  phone: '081234567890',
}

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DIRECT_URL or DATABASE_URL is required for seeding')
}
const adapter = new PrismaPg({
  connectionString,
  ...pgSslOptions(connectionString),
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('╔══════════════════════════════════════╗')
  console.log('║   Seed: ADMIN ONLY (minimal, clean)  ║')
  console.log('╚══════════════════════════════════════╝\n')

  console.log('── Admin user ──')
  const passwordHash = await bcrypt.hash(ADMIN.password, 10)
  const user = await prisma.user.upsert({
    where: { identifier: ADMIN.username },
    update: {
      ...(resetPassword && { passwordHash }),
      isActive: true,
      deletedAt: null,
    },
    create: { identifier: ADMIN.username, passwordHash, isActive: true },
  })

  const existingProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
  })
  if (!existingProfile) {
    await prisma.profile.create({
      data: {
        userId: user.id,
        name: ADMIN.name,
        nik: ADMIN.nik,
        gender: ADMIN.gender,
        birthPlace: ADMIN.birthPlace,
        birthDate: ADMIN.birthDate,
        email: ADMIN.email,
        phone: ADMIN.phone,
      },
    })
  }

  console.log('── SUPER_ADMIN role and permissions ──')
  await syncPermissions(prisma)
  const superAdmin = await prisma.role.findUniqueOrThrow({
    where: { code: 'SUPER_ADMIN' },
  })

  console.log('── Linking admin → SUPER_ADMIN ──')
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: superAdmin.id } },
    update: {},
    create: { userId: user.id, roleId: superAdmin.id },
  })

  console.log(
    `\n✓ Done. Login as "${ADMIN.username}" with SEED_ADMIN_PASSWORD (SUPER_ADMIN).`,
  )
  console.log('  Everything else is empty for manual testing.')
}

main()
  .catch((e) => {
    console.error('\n✗ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
