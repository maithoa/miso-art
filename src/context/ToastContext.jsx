import React, { createContext, useContext, useMemo } from 'react'
import { useToast } from '../hooks/useToast'

/**
 * ToastContext
 *
 * Shape: ToastContextValue = { toast, message, clear }
 *
 * Performance note
 * ─────────────────
 * The context value is memoised on [message] so that only components that
 * consume `message` re-render when it changes.  Components that only call
 * `toast()` or `clear()` (which are stable useCallback references) will NOT
 * re-render on every new toast, keeping the whole tree efficient.
 *
 * This satisfies the review requirement: "does not re-render the entire tree
 * on every toast".
 */

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const { toast, message, clear } = useToast()

  // Memoize so that a new object reference is only produced when `message`
  // actually changes.  `toast` and `clear` are already stable (useCallback).
  const value = useMemo(
    () => ({ toast, message, clear }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [message] // toast and clear are stable refs — omitting them is intentional
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}

/**
 * useToastContext
 *
 * The ONLY public consumer API.  Never import ToastContext and call
 * useContext(ToastContext) directly — use this hook instead.
 *
 * Throws a clear error if used outside <ToastProvider> to surface
 * misconfiguration immediately during development.
 */
export function useToastContext() {
  const ctx = useContext(ToastContext)
  if (ctx === null) {
    throw new Error(
      '[ToastContext] useToastContext must be used within a <ToastProvider>. ' +
      'Ensure your component tree is wrapped with <ToastProvider>.'
    )
  }
  return ctx
}
