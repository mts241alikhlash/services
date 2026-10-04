import {
  AdmissionNotificationService,
  GetMyNotificationsUseCase,
  MarkNotificationReadUseCase,
  NotificationModule,
} from '../../index.js'

describe('Notification public API', () => {
  it('exposes notification module, service, and operations', () => {
    expect(NotificationModule).toBeDefined()
    expect(AdmissionNotificationService).toBeDefined()
    expect(GetMyNotificationsUseCase).toBeDefined()
    expect(MarkNotificationReadUseCase).toBeDefined()
  })
})
