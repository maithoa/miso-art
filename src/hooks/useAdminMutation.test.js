import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAdminMutation } from './useAdminMutation'

describe('useAdminMutation', () => {
  it('loading is true during the async call and false after it resolves', async () => {
    // Capture resolve so we can control when the promise settles
    let resolve
    const asyncFn = () => new Promise((res) => { resolve = res })

    const { result } = renderHook(() => useAdminMutation())

    expect(result.current.loading).toBe(false)

    let mutatePromise
    act(() => {
      mutatePromise = result.current.mutate(asyncFn)
    })

    // Mid-flight: loading should be true
    expect(result.current.loading).toBe(true)

    // Settle the async fn then wait for hook state to flush
    await act(async () => {
      resolve()
      await mutatePromise
    })

    expect(result.current.loading).toBe(false)
  })

  it('sets error to the caught message string when asyncFn rejects', async () => {
    const asyncFn = () => Promise.reject(new Error('something went wrong'))

    const { result } = renderHook(() => useAdminMutation())

    await act(async () => {
      await result.current.mutate(asyncFn)
    })

    // error must be a plain string, never an Error object
    expect(result.current.error).toBe('something went wrong')
    expect(typeof result.current.error).toBe('string')
  })

  it('sets error to a fallback string when the rejection value has no message', async () => {
    // Rejecting with a non-Error value should still yield a string
    const asyncFn = () => Promise.reject('raw string rejection')

    const { result } = renderHook(() => useAdminMutation())

    await act(async () => {
      await result.current.mutate(asyncFn)
    })

    expect(typeof result.current.error).toBe('string')
    expect(result.current.error).not.toBeNull()
  })

  it('clearError resets error to null', async () => {
    const asyncFn = () => Promise.reject(new Error('boom'))

    const { result } = renderHook(() => useAdminMutation())

    await act(async () => {
      await result.current.mutate(asyncFn)
    })

    // Precondition: error is set
    expect(result.current.error).toBe('boom')

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })

  it('a successful mutate call clears a previously set error', async () => {
    const failingFn = () => Promise.reject(new Error('first failure'))
    const succeedingFn = () => Promise.resolve()

    const { result } = renderHook(() => useAdminMutation())

    // First call — plants an error
    await act(async () => {
      await result.current.mutate(failingFn)
    })

    expect(result.current.error).toBe('first failure')

    // Second call — success should wipe the previous error
    await act(async () => {
      await result.current.mutate(succeedingFn)
    })

    expect(result.current.error).toBeNull()
  })

  it('loading returns to false even when asyncFn throws', async () => {
    const asyncFn = () => Promise.reject(new Error('hard fail'))

    const { result } = renderHook(() => useAdminMutation())

    await act(async () => {
      await result.current.mutate(asyncFn)
    })

    // Must not be stuck in loading after a rejection
    expect(result.current.loading).toBe(false)
  })

  it('mutate does not rethrow so callers need no try/catch', async () => {
    const asyncFn = () => Promise.reject(new Error('silent fail'))

    const { result } = renderHook(() => useAdminMutation())

    // If mutate rethrows, this act block would throw and fail the test
    await expect(
      act(async () => {
        await result.current.mutate(asyncFn)
      })
    ).resolves.not.toThrow()
  })
})
