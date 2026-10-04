import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAdmissionNotificationRepository } from '../../domain/repositories/admission-notification-repository.js'
import { GetMyNotificationsUseCase } from './get-my-notifications/get-my-notifications.use-case.js'
import { MarkNotificationReadUseCase } from './mark-notification-read/mark-notification-read.use-case.js'

describe('Admission notification use-cases', () => {
  const repo = {
    findApplicationIdByUser: jest.fn(),
    findNotifications: jest.fn(),
    findMyNotification: jest.fn(),
    markNotificationRead: jest.fn(),
    markAllNotificationsRead: jest.fn(),
  }

  let getMine: GetMyNotificationsUseCase
  let markRead: MarkNotificationReadUseCase

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMyNotificationsUseCase,
        MarkNotificationReadUseCase,
        { provide: IAdmissionNotificationRepository, useValue: repo },
      ],
    }).compile()

    getMine = module.get(GetMyNotificationsUseCase)
    markRead = module.get(MarkNotificationReadUseCase)
    jest.clearAllMocks()
  })

  it('throws NotFound when the applicant has no application', async () => {
    repo.findApplicationIdByUser.mockResolvedValue(null)
    await expect(getMine.execute('u1')).rejects.toThrow(NotFoundException)
  })

  it('returns notifications for the applicant application', async () => {
    repo.findApplicationIdByUser.mockResolvedValue('app1')
    repo.findNotifications.mockResolvedValue({ data: [], unreadCount: 0 })

    await expect(getMine.execute('u1')).resolves.toEqual({
      data: [],
      unreadCount: 0,
    })
    expect(repo.findNotifications).toHaveBeenCalledWith('app1')
  })

  it('throws NotFound for a notification the applicant does not own', async () => {
    repo.findMyNotification.mockResolvedValue(null)
    await expect(markRead.executeOne('u1', 'n1')).rejects.toThrow(
      NotFoundException,
    )
  })

  it('marks all notifications as read', async () => {
    const result = await markRead.executeAll('u1')
    expect(repo.markAllNotificationsRead).toHaveBeenCalledWith('u1')
    expect(result).toEqual({ success: true })
  })
})
