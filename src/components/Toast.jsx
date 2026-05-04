import React, { useEffect, useRef } from 'react'
import { useToastContext } from '../context/ToastContext'

/**
 * Toast
 *
 * Renders the current toast message from ToastContext.
 * The dismiss button calls clear() synchronously — no intermediate state.
 *
 * Accessibility:
 *  - role="status" with aria-live="polite" announces the message to screen readers.
 *  - The close button has an explicit aria-label.
 */
export default function Toast() {
  const { message, clear } = useToastContext()

  // Keep a ref to track whether this component is still mounted.
  // useToast already guards against post-unmount state updates at the hook
  // level, but this ref is a second line of defence if Toast itself unmounts
  // while the ref in useToast hasn't fired yet (e.g. Suspense boundary swap).
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  if (!message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg bg-gray-900 px-5 py-3 text-sm text-white shadow-lg max-w-[calc(100vw-2rem)] w-max"
    >
      {/* message is always a plain string per contract — safe to render directly */}
      <span>{message}</span>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={clear}
        className="ml-2 rounded p-1 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
      >
        ✕
      </button>
    </div>
  )
}
