
import Link from 'next/link';
import { Coins } from 'lucide-react';

interface FooterProps {
  activeDatabaseSystem?: string;
}

export default function Footer({ activeDatabaseSystem }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
    { href: '/faq', label: 'FAQ' },
  ];

  const legalLinks = [
    { href: '/terms', label: 'Terms of Service' },
    { href: '/privacy', label: 'Privacy Policy' },
  ];

  return (
    <footer className="border-t bg-secondary/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Coluna 1: Logo e Slogan */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-3">
              <Coins className="h-8 w-8 text-primary" />
              <span className="font-bold text-2xl">BidExpert</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your expert partner in online auctions. Find rare items and bid with confidence.
            </p>
          </div>

          {/* Coluna 2: Quick Links */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3: Legal */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-3">Legal</h3>
            <ul className="space-y-2">
              {legalLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} BidExpert. All rights reserved.
          </p>
          {process.env.NODE_ENV === 'development' && activeDatabaseSystem && (
            <p className="text-xs text-muted-foreground mt-2">
              Active DB System: <span className="font-semibold text-primary">{activeDatabaseSystem}</span> (Dev Only)
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
