import { ForbiddenException } from '@nestjs/common'
import {
  MATH_7,
  TEACHER,
  buildTeacherScope,
} from '../../question/application/question.repository.fake.js'
import { ImportQuestionsUseCase } from '../../question-import/application/use-cases/import-questions/import-questions.use-case.js'
import { UploadExamFileUseCase } from '../../exam-file/application/use-cases/upload-exam-file/upload-exam-file.use-case.js'
import {
  FakeExamFileRepository,
  FakeExamFileStorage,
} from '../../exam-file/application/exam-file.fakes.fake.js'
import { AUTHOR, reviewWorld } from './package-review.test-support.js'
import { TRUE_FALSE_INPUT } from './package-question.test-support.js'
import { AddPackageQuestionUseCase } from './use-cases/add-package-question/add-package-question.use-case.js'
import { DeleteExamPackageUseCase } from './use-cases/delete-exam-package/delete-exam-package.use-case.js'
import { RemovePackageQuestionUseCase } from './use-cases/remove-package-question/remove-package-question.use-case.js'
import { RenameExamPackageUseCase } from './use-cases/rename-exam-package/rename-exam-package.use-case.js'
import { ReorderPackageQuestionsUseCase } from './use-cases/reorder-package-questions/reorder-package-questions.use-case.js'
import { SubmitExamPackageUseCase } from './use-cases/submit-exam-package/submit-exam-package.use-case.js'
import { TakePackageQuestionsUseCase } from './use-cases/take-package-questions/take-package-questions.use-case.js'
import { UpdatePackageQuestionUseCase } from './use-cases/update-package-question/update-package-question.use-case.js'

const COLLEAGUE = {
  id: 'user-7',
  roles: ['TEACHER'],
  permissions: ['exam-packages.update'],
}
const MANAGER = {
  id: 'user-8',
  roles: ['CURRICULUM_STAFF'],
  permissions: ['exam-packages.update', 'exam-questions.manage-all'],
}

async function setup() {
  const world = await reviewWorld(2)
  const { scope, employees } = buildTeacherScope({
    employeeId: 'emp-7',
    pairs: [MATH_7],
    existingEmployees: ['emp-1'],
  })
  const source = await world.packages.create({
    title: 'Asal',
    ...MATH_7,
    createdById: 'user-9',
    items: [],
  })
  world.packages.packages.set(source.id, {
    ...source,
    status: 'APPROVED',
    items: world.packages.packages
      .get(world.pkg.id)!
      .items.map((item) => ({ ...item })),
  })
  return { ...world, scope, employees, sourceId: source.id }
}

describe('a package can be changed only by the teacher who started it, or a manager', () => {
  it('refuses a colleague on every change', async () => {
    const w = await setup()
    const [first] = w.questionIds
    const attempts: (() => Promise<unknown>)[] = [
      () =>
        new AddPackageQuestionUseCase(
          w.packages,
          w.questions,
          w.scope,
          w.employees,
        ).execute(COLLEAGUE, w.pkg.id, TRUE_FALSE_INPUT),
      () =>
        new UpdatePackageQuestionUseCase(
          w.packages,
          w.questions,
          w.scope,
        ).execute(COLLEAGUE, w.pkg.id, first, { points: 3 }),
      () =>
        new RemovePackageQuestionUseCase(w.packages, w.scope).execute(
          COLLEAGUE,
          w.pkg.id,
          first,
        ),
      () =>
        new ReorderPackageQuestionsUseCase(w.packages, w.scope).execute(
          COLLEAGUE,
          w.pkg.id,
          [...w.questionIds].reverse(),
        ),
      () =>
        new TakePackageQuestionsUseCase(
          w.packages,
          w.questions,
          w.scope,
          w.employees,
        ).execute(COLLEAGUE, w.pkg.id, w.sourceId, [first]),
      () =>
        new RenameExamPackageUseCase(w.packages, w.scope).execute(
          COLLEAGUE,
          w.pkg.id,
          'Baru',
        ),
      () =>
        new SubmitExamPackageUseCase(w.packages, w.scope).execute(
          COLLEAGUE,
          w.pkg.id,
        ),
      () =>
        new DeleteExamPackageUseCase(w.packages).execute(COLLEAGUE, w.pkg.id),
      () =>
        new ImportQuestionsUseCase(
          w.scope,
          w.packages,
          w.employees,
          new UploadExamFileUseCase(
            new FakeExamFileRepository(),
            new FakeExamFileStorage(),
          ),
        ).execute(COLLEAGUE, {
          buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0]),
          size: 5,
          fileName: 'soal.xlsx',
          packageId: w.pkg.id,
        }),
    ]

    for (const attempt of attempts) {
      await expect(attempt()).rejects.toThrow(ForbiddenException)
    }
  })

  it('lets the author and a manager through', async () => {
    const w = await setup()
    const rename = new RenameExamPackageUseCase(w.packages, w.scope)

    expect((await rename.execute(AUTHOR, w.pkg.id, 'Satu')).title).toBe('Satu')
    expect((await rename.execute(MANAGER, w.pkg.id, 'Dua')).title).toBe('Dua')
    expect(TEACHER.id).toBe(AUTHOR.id)
  })
})
