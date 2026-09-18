import { Permission, PrismaClient, Role } from '@prisma/client'
import { SYSTEM_PERMISSIONS } from '../../../src/access-control/permission/constants/permission-codes.constants.js'

const ROLE_BYPASS_EXEMPT_PREFIXES = ['portal-', 'payroll-'] as const

function isBypassExempt(code: string): boolean {
  return ROLE_BYPASS_EXEMPT_PREFIXES.some((prefix) => code.startsWith(prefix))
}

export async function seedIam(prisma: PrismaClient) {
  console.log('  [iam] seeding roles and permissions...')

  const permissions: Permission[] = []
  for (const perm of SYSTEM_PERMISSIONS) {
    const dbPerm = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        module: perm.module,
        action: perm.action,
        description: perm.description,
      },
      create: perm,
    })
    permissions.push(dbPerm)
  }
  console.log(`  [iam] seeded ${permissions.length} permissions.`)

  const rolesMap = new Map<string, Role>()

  const roleDefs = [
    {
      code: 'SUPER_ADMIN',
      name: 'Super Admin',
      description: 'Platform Super Admin',
      isSystem: true,
    },
    {
      code: 'ADMIN',
      name: 'Administrator',
      description: 'Institution Administrator',
      isSystem: true,
    },
    {
      code: 'TEACHER',
      name: 'Teacher',
      description: 'Institution Teacher',
      isSystem: true,
    },
    {
      code: 'STUDENT',
      name: 'Student',
      description: 'Institution Student',
      isSystem: true,
    },
    {
      code: 'PARENT',
      name: 'Parent',
      description: 'Student Parent',
      isSystem: false,
    },
    {
      code: 'PRINCIPAL',
      name: 'Kepala Sekolah',
      description: 'School Headmaster',
      isSystem: false,
    },
    {
      code: 'APPLICANT',
      name: 'Pendaftar',
      description: 'Admission Applicant',
      isSystem: true,
    },
  ]

  for (const r of roleDefs) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: {
        name: r.name,
        description: r.description,
        isSystem: r.isSystem,
      },
      create: {
        code: r.code,
        name: r.name,
        description: r.description,
        isSystem: r.isSystem,
      },
    })
    rolesMap.set(r.code, role)
  }
  console.log('  [iam] seeded default roles.')

  const superAdminRole = rolesMap.get('SUPER_ADMIN')!
  const adminRole = rolesMap.get('ADMIN')!
  const teacherRole = rolesMap.get('TEACHER')!
  const studentRole = rolesMap.get('STUDENT')!
  const parentRole = rolesMap.get('PARENT')!
  const principalRole = rolesMap.get('PRINCIPAL')!

  await prisma.rolePermission.deleteMany({
    where: {
      roleId: {
        in: [
          superAdminRole.id,
          adminRole.id,
          teacherRole.id,
          studentRole.id,
          parentRole.id,
          principalRole.id,
        ],
      },
    },
  })

  for (const perm of permissions) {
    await prisma.rolePermission.create({
      data: { roleId: superAdminRole.id, permissionId: perm.id },
    })
  }

  for (const perm of permissions) {
    if (isBypassExempt(perm.code)) continue
    await prisma.rolePermission.create({
      data: { roleId: adminRole.id, permissionId: perm.id },
    })
  }

  const teacherPermissionCodes = [
    'dashboards.read-own',

    'teaching-assignments.read-own',
    'schedules.read-own',

    'attendances.read',
    'attendances.manage',

    'assessment-items.read',
    'assessment-items.create',
    'assessment-items.update',
    'assessment-items.delete',

    'student-scores.read',
    'student-scores.create',
    'student-scores.update',
    'student-scores.manage-assigned',

    'report-cards.read',
    'report-cards.create',
    'report-cards.publish',

    'announcements.read',
    'academic-calendars.read',

    'students.read',
    'teachers.read',

    'academic-years.read',
    'classrooms.read',
    'subjects.read',
    'semesters.read',
    'enrollments.read',
    'time-slots.read',

    'religions.read',
    'blood-types.read',
    'educations.read',
    'achievement-types.read',
  ]
  for (const perm of permissions) {
    if (teacherPermissionCodes.includes(perm.code)) {
      await prisma.rolePermission.create({
        data: { roleId: teacherRole.id, permissionId: perm.id },
      })
    }
  }

  const studentPermissionCodes = [
    'dashboards.read-own',
    'students.read-own',
    'attendances.read-own',
    'report-cards.read-own',
    'student-scores.read-own',
    'schedules.read-own',

    'announcements.read-own',
    'academic-calendars.read',
    'subjects.read',

    'classrooms.read-own',

    'time-slots.read',

    'religions.read',
    'blood-types.read',
  ]
  for (const perm of permissions) {
    if (studentPermissionCodes.includes(perm.code)) {
      await prisma.rolePermission.create({
        data: { roleId: studentRole.id, permissionId: perm.id },
      })
    }
  }

  const parentPermissionCodes: string[] = []
  for (const perm of permissions) {
    if (parentPermissionCodes.includes(perm.code)) {
      await prisma.rolePermission.create({
        data: { roleId: parentRole.id, permissionId: perm.id },
      })
    }
  }

  const principalPermissionCodes = [
    'inventory-approvals.read',
    'inventory-approvals.update',
    'inventory-loans.read',
    'inventory-assets.read',
  ]
  for (const perm of permissions) {
    if (principalPermissionCodes.includes(perm.code)) {
      await prisma.rolePermission.create({
        data: { roleId: principalRole.id, permissionId: perm.id },
      })
    }
  }

  console.log('  [iam] role permissions mapped.')

  const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin'
  const adminUser = await prisma.user.findFirst({
    where: { identifier: adminUsername, deletedAt: null },
  })

  if (adminUser) {
    await prisma.userRole.deleteMany({
      where: { userId: adminUser.id },
    })

    await prisma.userRole.createMany({
      data: [
        { userId: adminUser.id, roleId: superAdminRole.id },
        { userId: adminUser.id, roleId: adminRole.id },
      ],
    })
    console.log(
      `  [iam] admin user '${adminUsername}' linked to SUPER_ADMIN and ADMIN roles.`,
    )
  }
}
