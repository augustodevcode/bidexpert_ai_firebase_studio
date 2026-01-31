/**
 * @fileoverview Testes unitários do AdminQueryMonitor.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminQueryMonitor from '@/components/support/admin-query-monitor';

describe('AdminQueryMonitor', () => {
  beforeEach(() => {
    // mock fetch to avoid network calls
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ queries: [], stats: { total: 0, avgDuration: 0, slowQueries: 0, failedQueries: 0 } }) })) as any;
  });

  afterEach(() => {
    // cleanup CSS var
    try {
      document.documentElement.style.removeProperty('--admin-query-monitor-height');
    } catch (e) {}
    vi.resetAllMocks();
  });

  it('sets CSS var for collapsed/expanded heights', async () => {
    const { unmount } = render(<AdminQueryMonitor />);

    // collapsed by default
    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--admin-query-monitor-height')).toBe('48px');
    });

    // find toggle button and expand
    const toggleBtn = screen.getByRole('button', { name: /Expandir|Minimizar/ });
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--admin-query-monitor-height')).toBe('384px');
    });

    // unmount should reset to collapsed
    unmount();
    expect(document.documentElement.style.getPropertyValue('--admin-query-monitor-height')).toBe('48px');
  });

  it('renders Dev Info inside the monitor', async () => {
    render(<AdminQueryMonitor />);
    expect(await screen.findByText('Dev Info')).toBeInTheDocument();
  });
});
