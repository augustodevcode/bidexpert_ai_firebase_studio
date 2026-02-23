import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsignorLogoBadge } from '@/components/consignor-logo-badge';

// Mock Avatar components to render img element directly in tests
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  AvatarImage: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
  AvatarFallback: ({ children }: { children: React.ReactNode }) => null,
}));

describe('ConsignorLogoBadge', () => {
  it('renders logo and reveals name on hover', async () => {
    render(<ConsignorLogoBadge logoUrl="https://example.com/logo.png" name="Comitente XPTO" />);

    const img = screen.getByRole('img', { name: /comitente xpto/i });
    await userEvent.hover(img);

    const texts = await screen.findAllByText(/Comitente XPTO/i);
    expect(texts.length).toBeGreaterThan(0);
  });

  it('does not render when logo is missing', () => {
    render(<ConsignorLogoBadge logoUrl={null} name="Sem Logo" />);

    expect(screen.queryByRole('img')).toBeNull();
  });
});
