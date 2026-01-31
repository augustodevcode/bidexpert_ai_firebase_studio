/**
 * @fileoverview Testes unitários do DevInfoIndicator.
 */
import { render, screen } from '@testing-library/react';
import DevInfoIndicator from '@/components/layout/dev-info-indicator';

describe('DevInfoIndicator', () => {
  it('renders and is not fixed (shares space with Query Monitor)', () => {
    render(<DevInfoIndicator />);
    const el = screen.getByTestId('dev-info-indicator');
    expect(el).toBeInTheDocument();
    // Ensure it's not fixed/sticky
    expect(el.className).not.toMatch(/fixed/);
  });
});
