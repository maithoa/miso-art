import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminRoute from './AdminRoute';

vi.mock('../supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
  },
}));

import { supabase } from '../supabase';

function renderAdminRoute() {
  return render(
    <MemoryRouter initialEntries={["/admin/orders"]}>
      <Routes>
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <div>Admin Content</div>
            </AdminRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function mockProfile(isAdmin) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(
      isAdmin !== null
        ? { data: { is_admin: isAdmin }, error: null }
        : { data: null, error: null }
    ),
  };
  supabase.from.mockReturnValue(chain);
  return chain;
}

describe('AdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while checking session', async () => {
    // getSession never resolves during this test
    supabase.auth.getSession.mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={["/admin/orders"]}>
        <Routes>
          <Route
            path="/admin/orders"
            element={<AdminRoute><div>Admin Content</div></AdminRoute>}
          />
        </Routes>
      </MemoryRouter>
    );

    // Spinner is present; content is not
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects to /login when there is no session', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });

    await act(async () => { renderAdminRoute(); });

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('redirects to /login when user is not an admin', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    });
    // is_admin = false
    mockProfile(false);

    await act(async () => { renderAdminRoute(); });

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('renders children when user is an admin', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-1' } } },
    });
    // is_admin = true
    mockProfile(true);

    await act(async () => { renderAdminRoute(); });

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
