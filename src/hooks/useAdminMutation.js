import { useState } from 'react';

// Generic mutation hook for admin actions: tracks loading/error without rethrowing
export function useAdminMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = () => setError(null);

  // mutate wraps an async function, managing loading/error state; never rethrows
  const mutate = async (asyncFn) => {
    setLoading(true);
    // clear previous error on each new call attempt
    setError(null);
    try {
      await asyncFn();
    } catch (e) {
      // store string so callers can render directly in JSX
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error, clearError };
}
