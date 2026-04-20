/**
 * @fileoverview Testes unitários complementares do painel DevInfoIndicator.
 */
import { render, screen } from '@testing-library/react';
import DevInfoIndicator from '@/components/layout/dev-info-indicator';

describe('DevInfoIndicator', () => {
  it('renders as reusable panel content instead of fixed footer', () => {
    render(<DevInfoIndicator className="border-0 bg-transparent p-0" showTitle={false} />);
    const el = screen.getByTestId('dev-info-indicator');
    expect(el).toBeInTheDocument();
    expect(el.className).not.toMatch(/fixed/);
    expect(screen.queryByText('Dev Info')).not.toBeInTheDocument();
  });
});
