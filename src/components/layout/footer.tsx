
import Link from 'next/link';
import { Coins, Facebook, Twitter, Instagram, Linkedin, Youtube, ShieldCheck } from 'lucide-react';
import DevInfoIndicator from '@/components/layout/dev-info-indicator';
import AppVersionBadge from '@/components/layout/app-version-badge';

export default function Footer() {
  const quickLinks = [
    { href: '/about', label: 'Sobre Nós' },
    { href: '/contact', label: 'Contato' },
    { href: '/faq', label: 'FAQ' },
    { href: '/sell-with-us', label: 'Venda Conosco'}
  ];

  const legalLinks = [
    { href: '/terms', label: 'Termos de Serviço' },
    { href: '/privacy', label: 'Política de Privacidade' },
    { href: '/auction-safety-tips', label: 'Dicas de Segurança em Leilões', icon: <ShieldCheck className="inline-block h-3.5 w-3.5 mr-1 relative -top-px" /> },
  ];

  const socialLinks = [
    { href: 'https://facebook.com/bidexpert', label: 'Facebook', icon: <Facebook className="h-5 w-5" /> },
    { href: 'https://twitter.com/bidexpert', label: 'Twitter', icon: <Twitter className="h-5 w-5" /> },
    { href: 'https://instagram.com/bidexpert', label: 'Instagram', icon: <Instagram className="h-5 w-5" /> },
    { href: 'https://linkedin.com/company/bidexpert', label: 'LinkedIn', icon: <Linkedin className="h-5 w-5" /> },
    { href: 'https://youtube.com/@bidexpert', label: 'YouTube', icon: <Youtube className="h-5 w-5" /> },
  ];

  return (
    <footer className="border-t bg-secondary/50 text-secondary-foreground mt-auto">
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Coluna 1: Logo e Slogan */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-3">
              <Coins className="h-8 w-8 text-primary" />
              <span className="font-bold text-2xl text-foreground">BidExpert</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Sua plataforma especialista em leilões online. Encontre itens raros e faça seus lances com confiança.
            </p>
          </div>

          {/* Coluna 2: Links Rápidos */}
          <div>
            <h3 className="text-md font-semibold text-foreground mb-3">Links Rápidos</h3>
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
          <div>
            <h3 className="text-md font-semibold text-foreground mb-3">Legal</h3>
            <ul className="space-y-2">
              {legalLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center">
                    {link.icon && <span className="mr-1.5">{link.icon}</span>}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 4: Redes Sociais */}
          <div>
             <h3 className="text-md font-semibold text-foreground mb-3">Siga-nos</h3>
             <div className="flex space-x-4">
                {socialLinks.map(social => (
                    <Link key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label={social.label}>
                        {social.icon}
                    </Link>
                ))}
             </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col items-center gap-2">
          {/* GAP 5.28: SSL Trust Badge */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground" data-ai-id="footer-ssl-badge">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <span>Ambiente Seguro · Conexão Criptografada SSL/TLS · Dados Protegidos</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} BidExpert. Todos os direitos reservados.
          </p>
          <AppVersionBadge />
          {/* O DevInfoIndicator agora é renderizado dentro de cada layout de painel */}
        </div>
      </div>
    </footer>
  );
}
