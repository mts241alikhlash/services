import { PrismaClient } from '@prisma/client'

const RELIGIONS = [
  'Islam',
  'Kristen Protestan',
  'Katolik',
  'Hindu',
  'Buddha',
  'Konghucu',
]

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export async function seedProfileReferences(prisma: PrismaClient) {
  let religions = 0
  for (const name of RELIGIONS) {
    const exists = await prisma.religion.findFirst({ where: { name } })
    if (!exists) {
      await prisma.religion.create({ data: { name } })
      religions++
    }
  }

  let bloodTypes = 0
  for (const name of BLOOD_TYPES) {
    const exists = await prisma.bloodType.findFirst({ where: { name } })
    if (!exists) {
      await prisma.bloodType.create({ data: { name } })
      bloodTypes++
    }
  }

  console.log(
    `  [religions]   ${religions} created, ${await prisma.religion.count()} total`,
  )
  console.log(
    `  [blood-types] ${bloodTypes} created, ${await prisma.bloodType.count()} total`,
  )
}
