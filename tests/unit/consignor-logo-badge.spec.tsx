import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsignorLogoBadge } from '@/components/consignor-logo-badge';

describe('ConsignorLogoBadge', () => {
  it('renders logo and reveals name on hover', async () => {
    render(<ConsignorLogoBadge logoUrl="https://example.com/logo.png" name="Comitente XPTO" />);

    const img = screen.getByRole('img', { name: /comitente xpto/i });
    await userEvent.hover(img);

    expect(await screen.findByText(/Comitente: Comitente XPTO/i)).toBeInTheDocument();
  });

  it('does not render when logo is missing', () => {
    render(<ConsignorLogoBadge logoUrl={null} name="Sem Logo" />);

    expect(screen.queryByRole('img')).toBeNull();
  });
});
