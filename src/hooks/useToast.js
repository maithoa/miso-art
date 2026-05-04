import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * useToast
 *
 * Manages a single transient toast message with a 4000 ms auto-clear.
 *
 * Guarantees:
 *  - Timer is cancelled when a new toast fires before the previous one expires.
 *  - Timer is cancelled on unmount so no state update occurs after the
 *    component tree is torn down (no memory leak).
 *  - clear() is synchronous — it clears the timeout AND nulls the message in
 *    the same call, giving the dismiss button instant feedback.
 *
 * @returns {ToastContextValue} { toast, message, clear }
 */
export function useToast() {
  const [message, setMessage] = useState(null)
  // Store the timeout id in a ref so it is stable across renders and never
  // causes an extra re-render when updated.
  const timerRef = useRef(null)

  // cancelTimer is not exposed — internal helper only.
  const cancelTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  /**
   * toast — display a new message.
   * Cancels any in-flight timer first to prevent stale clear from an earlier
   * message silencing the new one prematurely.
   */
  const toast = useCallback(
    (msg) => {
      if (typeof msg !== 'string') {
        // Defensive: contract requires plain string, never JSX.
        return
      }
      cancelTimer()
      setMessage(msg)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        setMessage(null)
      }, 4000)
    },
    [cancelTimer]
  )

  /**
   * clear — synchronously dismiss the toast and cancel the pending timer.
   * Must be synchronous so the dismiss button hides the toast immediately.
   */
  const clear = useCallback(() => {
    cancelTimer()
    setMessage(null)
  }, [cancelTimer])

  // Cleanup on unmount: cancel any pending timer so we never call setMessage
  // on an unmounted component.
  useEffect(() => {
    return () => {
      cancelTimer()
    }
  }, [cancelTimer])

  return { toast, message, clear }
}
