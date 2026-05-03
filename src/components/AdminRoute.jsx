import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function AdminRoute({ children }) {
  // null = still loading, false = denied, true = authorised
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1. Check for an active session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) setStatus('no-session');
        return;
      }

      // 2. Fetch the profile to read is_admin flag
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error || !profile || !profile.is_admin) {
        setStatus('not-admin');
      } else {
        setStatus('admin');
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (status === 'no-session' || status === 'not-admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
