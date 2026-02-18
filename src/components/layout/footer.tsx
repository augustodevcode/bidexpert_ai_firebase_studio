
import Link from 'next/link';
import { Coins, Facebook, Twitter, Instagram, Linkedin, Youtube, ShieldCheck } from 'lucide-react';
import DevInfoIndicator from '@/components/layout/dev-info-indicator'; 

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
    <footer className="footer-platform" data-ai-id="footer-main">
      <div className="container-footer-content" data-ai-id="footer-container">
        <div className="grid-footer-links" data-ai-id="footer-links-grid">
          {/* Coluna 1: Logo e Slogan */}
          <div className="wrapper-footer-brand" data-ai-id="footer-brand-column">
            <Link href="/" className="link-footer-logo" data-ai-id="footer-logo-link">
              <Coins className="icon-footer-logo" data-ai-id="footer-logo-icon" />
              <span className="text-footer-brand" data-ai-id="footer-brand-name">BidExpert</span>
            </Link>
            <p className="text-footer-slogan" data-ai-id="footer-slogan">
              Sua plataforma especialista em leilões online. Encontre itens raros e faça seus lances com confiança.
            </p>
          </div>

          {/* Coluna 2: Links Rápidos */}
          <div className="wrapper-footer-quick-links" data-ai-id="footer-quick-links-column">
            <h3 className="header-footer-section" data-ai-id="footer-quick-links-header">Links Rápidos</h3>
            <ul className="list-footer-links" data-ai-id="footer-quick-links-list">
              {quickLinks.map(link => (
                <li key={link.href} className="item-footer-link" data-ai-id={`footer-quick-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Link href={link.href} className="link-footer-item">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3: Legal */}
          <div className="wrapper-footer-legal-links" data-ai-id="footer-legal-links-column">
            <h3 className="header-footer-section" data-ai-id="footer-legal-header">Legal</h3>
            <ul className="list-footer-links" data-ai-id="footer-legal-links-list">
              {legalLinks.map(link => (
                <li key={link.href} className="item-footer-link" data-ai-id={`footer-legal-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Link href={link.href} className="link-footer-item">
                    {link.icon && <span className="icon-footer-legal" data-ai-id="footer-legal-icon">{link.icon}</span>}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 4: Redes Sociais */}
          <div className="wrapper-footer-social-links" data-ai-id="footer-social-column">
             <h3 className="header-footer-section" data-ai-id="footer-social-header">Siga-nos</h3>
             <div className="list-footer-social" data-ai-id="footer-social-list">
                {socialLinks.map(social => (
                    <Link key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="link-footer-social" aria-label={social.label} data-ai-id={`footer-social-link-${social.label.toLowerCase()}`}>
                        {social.icon}
                    </Link>
                ))}
             </div>
          </div>
        </div>

        <div className="section-footer-bottom" data-ai-id="footer-bottom-section">
          {/* GAP 5.28: SSL Trust Badge */}
          <div className="wrapper-footer-ssl-badge" data-ai-id="footer-ssl-badge">
            <ShieldCheck className="icon-footer-ssl" />
            <span className="text-footer-ssl">Ambiente Seguro · Conexão Criptografada SSL/TLS · Dados Protegidos</span>
          </div>
          <p className="text-footer-copy" data-ai-id="footer-copyright">
            &copy; {new Date().getFullYear()} BidExpert. Todos os direitos reservados.
          </p>
          {/* O DevInfoIndicator agora é renderizado dentro de cada layout de painel */}
        </div>
      </div>
    </footer>
  );
}
