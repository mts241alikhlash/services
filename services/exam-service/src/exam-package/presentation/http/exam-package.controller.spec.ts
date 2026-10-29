import 'reflect-metadata'
import { PERMISSIONS_KEY } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { ExamPackageController } from './exam-package.controller.js'

const expected: Record<string, string[]> = {
  findAll: ['exam-packages.read'],
  findOne: ['exam-packages.read'],
  create: ['exam-packages.create'],
  rename: ['exam-packages.update'],
  remove: ['exam-packages.delete'],
  copy: ['exam-packages.create'],
  findQuestion: ['exam-packages.read'],
  addQuestion: ['exam-packages.update'],
  updateQuestion: ['exam-packages.update'],
  removeQuestion: ['exam-packages.update'],
  reorderQuestions: ['exam-packages.update'],
  takeQuestions: ['exam-packages.update'],
  submit: ['exam-packages.update'],
  approve: ['exam-questions.approve'],
  returnPackage: ['exam-questions.approve'],
}

describe('ExamPackageController permissions', () => {
  it.each(Object.entries(expected))('%s requires %j', (method, codes) => {
    const handler = ExamPackageController.prototype[
      method as keyof ExamPackageController
    ] as unknown as object

    expect(Reflect.getMetadata(PERMISSIONS_KEY, handler)).toEqual(codes)
  })

  it('leaves no route without a permission', () => {
    const routes = Object.getOwnPropertyNames(
      ExamPackageController.prototype,
    ).filter((name) => name !== 'constructor')

    expect(routes.sort()).toEqual(Object.keys(expected).sort())
  })
})
