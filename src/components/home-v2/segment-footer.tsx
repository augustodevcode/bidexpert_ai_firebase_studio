/**
 * @file SegmentFooter Component
 * @description Comprehensive footer component with columns for about,
 * categories, channels, support, policies, and social links.
 */
'use client';

import Link from 'next/link';
import { 
  Gavel, Facebook, Twitter, Instagram, Linkedin, Youtube, 
  MessageCircle, ChevronRight, Mail, Phone, MapPin, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { SEGMENT_ORDER, SEGMENT_CONFIGS } from './segment-config';

interface SegmentFooterProps {
  className?: string;
}

export default function SegmentFooter({ className }: SegmentFooterProps) {
  const currentYear = new Date().getFullYear();

  const aboutLinks = [
    { href: '/about', label: 'Quem somos' },
    { href: '/about#careers', label: 'Trabalhe conosco' },
    { href: '/about#press', label: 'Imprensa' },
    { href: '/about#investors', label: 'Investidores' },
  ];

  const channelLinks = [
    { href: '/search?type=judicial', label: 'Judicial' },
    { href: '/search?type=corporativo', label: 'Corporativo' },
    { href: '/search?type=rural', label: 'Rural' },
    { href: '/search?type=governo', label: 'Governo Público' },
  ];

  const supportLinks = [
    { href: '/faq#como-comprar', label: 'Como comprar' },
    { href: '/faq#como-vender', label: 'Como vender' },
    { href: '/contact#ouvidoria', label: 'Ouvidoria' },
    { href: '/contact', label: 'Fale conosco' },
    { href: '/faq', label: 'Central de Ajuda' },
  ];

  const policyLinks = [
    { href: '/terms', label: 'Termos de uso' },
    { href: '/privacy', label: 'Política de privacidade' },
    { href: '/privacy#cookies', label: 'Cookies' },
    { href: '/about#ethics', label: 'Código de ética' },
    { href: '/privacy#lgpd', label: 'LGPD' },
  ];

  const socialLinks = [
    { href: 'https://facebook.com/bidexpert', label: 'Facebook', icon: Facebook },
    { href: 'https://instagram.com/bidexpert', label: 'Instagram', icon: Instagram },
    { href: 'https://linkedin.com/company/bidexpert', label: 'LinkedIn', icon: Linkedin },
    { href: 'https://youtube.com/@bidexpert', label: 'YouTube', icon: Youtube },
    { href: 'https://wa.me/5511999999999', label: 'WhatsApp', icon: MessageCircle },
  ];

  return (
    <footer className={cn("border-t bg-card", className)} data-testid="segment-footer">
      {/* Newsletter */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">Receba nossas ofertas</h3>
              <p className="text-sm text-muted-foreground">
                Cadastre-se para receber as melhores oportunidades em leilões
              </p>
            </div>
            <form className="flex w-full md:w-auto max-w-md gap-2">
              <Input
                type="email"
                placeholder="Seu e-mail"
                className="flex-1"
              />
              <Button type="submit">
                Cadastrar
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* About */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Gavel className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">BidExpert</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sua plataforma de leilões online com transparência, segurança e as melhores oportunidades.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>(11) 9999-9999</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>contato@bidexpert.com.br</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4">Categorias</h4>
            <ul className="space-y-2">
              {SEGMENT_ORDER.map((segmentId) => (
                <li key={segmentId}>
                  <Link
                    href={`/${segmentId}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {SEGMENT_CONFIGS[segmentId].name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Channels */}
          <div>
            <h4 className="font-semibold mb-4">Canais</h4>
            <ul className="space-y-2">
              {channelLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-semibold mb-4">Políticas</h4>
            <ul className="space-y-2">
              {policyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About company */}
          <div>
            <h4 className="font-semibold mb-4">Sobre</h4>
            <ul className="space-y-2">
              {aboutLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Social links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>

            {/* Legal info */}
            <div className="text-xs text-muted-foreground text-center md:text-right space-y-1">
              <p>BidExpert Leilões LTDA - CNPJ: 00.000.000/0001-00</p>
              <p>Rua Exemplo, 123 - São Paulo, SP - CEP 00000-000</p>
              <p>© {currentYear} BidExpert. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security badges */}
      <div className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Site Seguro</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <span>SSL Certificado</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Dados Protegidos</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Conformidade LGPD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
