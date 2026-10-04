import { type DynamicModule, type Type } from '@nestjs/common'
import { PrismaService } from '../../core/database/prisma.service.js'
import { createSimpleListControllers } from './simple-list.controller.js'
import { SimpleListRepository } from './simple-list.repository.js'
import { SimpleListService } from './simple-list.service.js'
import type {
  ISimpleListUsage,
  SimpleListDefinition,
  SimpleListDelegate,
} from './simple-list.types.js'

export const simpleListRepositoryToken = (definition: SimpleListDefinition) =>
  `SimpleListRepository:${definition.path}`

const simpleListServiceToken = (definition: SimpleListDefinition) =>
  `SimpleListService:${definition.path}`

const controllers = new Map<string, Type>()

export class SimpleListModule {
  static forList(definition: SimpleListDefinition): DynamicModule {
    const { controller, internalController } = createSimpleListControllers(
      definition,
      simpleListServiceToken(definition),
    )
    controllers.set(definition.path, controller)
    const usage = definition.usage
    const listModule = class {}
    Object.defineProperty(listModule, 'name', {
      value: `${definition.className}ListModule`,
    })
    return {
      module: listModule,
      controllers: [internalController, controller],
      providers: [
        ...(usage ? [usage] : []),
        {
          provide: simpleListRepositoryToken(definition),
          inject: [PrismaService],
          useFactory: (prisma: PrismaService) =>
            new SimpleListRepository(
              prisma[definition.model],
              definition.label,
            ),
        },
        {
          provide: simpleListServiceToken(definition),
          inject: [
            simpleListRepositoryToken(definition),
            ...(usage ? [usage] : []),
          ],
          useFactory: (
            repository: SimpleListRepository,
            used?: ISimpleListUsage,
          ) => new SimpleListService(repository, definition.label, used),
        },
      ],
    }
  }

  static controllerFor(definition: SimpleListDefinition): Type {
    const controller = controllers.get(definition.path)
    if (!controller)
      throw new Error(`No controller registered for ${definition.path}`)
    return controller
  }
}
