import type { PublishScoresUseCase } from '../../application/use-cases/publish-scores/publish-scores.use-case.js'
import { PublishScoresJob } from './publish-scores.job.js'

describe('PublishScoresJob', () => {
  it('does not start a second run while one is still going', async () => {
    let finish: () => void = () => undefined
    const execute = jest.fn(
      () => new Promise<number>((resolve) => (finish = () => resolve(0))),
    )
    const job = new PublishScoresJob({
      execute,
    } as unknown as PublishScoresUseCase)

    const first = job.run()
    await job.run()
    expect(execute).toHaveBeenCalledTimes(1)

    finish()
    await first
    const third = job.run()
    finish()
    await third
    expect(execute).toHaveBeenCalledTimes(2)
  })

  it('runs again after a failure', async () => {
    const execute = jest
      .fn<Promise<number>, []>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue(0)
    const job = new PublishScoresJob({
      execute,
    } as unknown as PublishScoresUseCase)

    await expect(job.run()).rejects.toThrow('boom')
    await job.run()

    expect(execute).toHaveBeenCalledTimes(2)
  })
})
