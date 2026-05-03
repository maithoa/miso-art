import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ThankYou from './ThankYou';

// Mock supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '../supabase';

const PAYMENT_INTENT_ID = 'pi_test_123';

function renderThankYou(search = `?payment_intent=${PAYMENT_INTENT_ID}`) {
  return render(
    <MemoryRouter initialEntries={[`/thank-you${search}`]}>
      <Routes>
        <Route path="/thank-you" element={<ThankYou />} />
      </Routes>
    </MemoryRouter>
  );
}

function buildSupabaseMock(returnValue) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(returnValue),
  };
  supabase.from.mockReturnValue(chain);
  return chain;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('ThankYou page', () => {
  it('shows loading/polling state on initial render', async () => {
    // Poll never resolves with data — stays in loading
    buildSupabaseMock({ data: null, error: null });

    await act(async () => { renderThankYou(); });

    expect(screen.getByText(/confirming your order/i)).toBeInTheDocument();
  });

  it('renders order confirmation when payment_confirmed is returned', async () => {
    const mockOrder = {
      id: 'order-abc',
      stripe_payment_id: PAYMENT_INTENT_ID,
      status: 'payment_confirmed',
      customer_name: 'Jane Doe',
      total: 4999,
    };
    buildSupabaseMock({ data: mockOrder, error: null });

    await act(async () => { renderThankYou(); });

    expect(screen.getByText(/order confirmed/i)).toBeInTheDocument();
    expect(screen.getByText(/jane doe/i)).toBeInTheDocument();
    expect(screen.getByText(/49.99/)).toBeInTheDocument();
  });

  it('shows fallback message after 30 seconds without confirmation', async () => {
    // Poll always returns null — no confirmed order
    buildSupabaseMock({ data: null, error: null });

    await act(async () => { renderThankYou(); });
    // Advance timers past 30 s timeout
    await act(async () => { vi.advanceTimersByTime(31000); });

    expect(screen.getByText(/still processing/i)).toBeInTheDocument();
    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
  });

  it('stops polling after confirmation is received', async () => {
    const mockOrder = {
      id: 'order-xyz',
      stripe_payment_id: PAYMENT_INTENT_ID,
      status: 'payment_confirmed',
      customer_name: 'John Smith',
      total: 1000,
    };
    const chain = buildSupabaseMock({ data: mockOrder, error: null });

    await act(async () => { renderThankYou(); });

    // Record call count right after first poll
    const callsAfterConfirmation = chain.maybeSingle.mock.calls.length;

    // Advance time well past multiple poll intervals — should not trigger more calls
    await act(async () => { vi.advanceTimersByTime(10000); });

    expect(chain.maybeSingle.mock.calls.length).toBe(callsAfterConfirmation);
  });

  it('stops polling after 30-second timeout', async () => {
    const chain = buildSupabaseMock({ data: null, error: null });

    await act(async () => { renderThankYou(); });

    // Advance past timeout
    await act(async () => { vi.advanceTimersByTime(31000); });

    const callsAtTimeout = chain.maybeSingle.mock.calls.length;

    // Advance further — no new poll calls expected
    await act(async () => { vi.advanceTimersByTime(10000); });

    expect(chain.maybeSingle.mock.calls.length).toBe(callsAtTimeout);
    expect(screen.getByText(/still processing/i)).toBeInTheDocument();
  });
});
