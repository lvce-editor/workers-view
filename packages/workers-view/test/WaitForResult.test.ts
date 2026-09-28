import { expect, jest, test } from '@jest/globals'
import { waitForResult } from '../src/parts/WaitForResult/WaitForResult.ts'

test('removes its cancellation listener after every successful or failed request', async () => {
  const controller = new AbortController()
  const add = jest.spyOn(controller.signal, 'addEventListener')
  const remove = jest.spyOn(controller.signal, 'removeEventListener')
  for (let i = 0; i < 100; i++) {
    const value = await waitForResult(controller.signal, Promise.resolve(i))
    expect(value).toBe(i)
  }
  const failure = Promise.reject(new Error('failed'))
  await expect(waitForResult(controller.signal, failure)).rejects.toThrow('failed')
  expect(add).toHaveBeenCalledTimes(101)
  expect(remove).toHaveBeenCalledTimes(101)
})

test('cancels pending requests and consumes late rejections', async () => {
  const controller = new AbortController()
  const deferred = Promise.withResolvers<void>()
  const pending = waitForResult(controller.signal, deferred.promise)
  controller.abort()
  await expect(pending).rejects.toThrow('closed')
  deferred.reject(new Error('late rejection'))
  await expect(waitForResult(controller.signal, Promise.resolve())).rejects.toThrow('closed')
})
