// src/components/layout/admin-sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ListChecks, Package, Landmark, Users, Settings, LayoutDashboard, Gavel, Map, Building2, Library, ShieldCheck, Layers, Tv, ShoppingCart, Scale, FileText, Boxes, Rocket, FileUp, BarChart, BookOpen, UserCheck, MessageSquare, Files } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const topLevelNavItems = [
  { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Auditório Virtual', href: '/live-dashboard', icon: Tv },
  { title: 'Wizard de Leilões', href: '/admin/wizard', icon: Rocket },
  { title: 'Importação CNJ', href: '/admin/import/cnj', icon: FileUp },
];

const auctionManagementItems = [
  { title: 'Leilões', href: '/admin/auctions', icon: Gavel },
  { title: 'Loteamento', href: '/admin/lotting', icon: Boxes },
  { title: 'Lotes', href: '/admin/lots', icon: Package },
  { title: 'Bens', href: '/admin/bens', icon: Package },
  { title: 'Venda Direta', href: '/admin/direct-sales', icon: ShoppingCart },
  { title: 'Categorias de Lotes', href: '/admin/categories', icon: ListChecks },
  { title: 'Subcategorias', href: '/admin/subcategories', icon: Layers },
];

const contentManagementItems = [
    { title: 'Blog', href: '/admin/blog', icon: BookOpen, disabled: true },
    { title: 'Biblioteca de Mídia', href: '/admin/media', icon: Library },
]

const judicialManagementItems = [
    { title: 'Tribunais', href: '/admin/courts', icon: Scale },
    { title: 'Comarcas', href: '/admin/judicial-districts', icon: Map },
    { title: 'Varas', href: '/admin/judicial-branches', icon: Building2 },
    { title: 'Processos', href: '/admin/judicial-processes', icon: FileText },
]

const platformManagementItems = [
  { title: 'Comitentes', href: '/admin/sellers', icon: Users },
  { title: 'Leiloeiros', href: '/admin/auctioneers', icon: Landmark },
  { title: 'Estados', href: '/admin/states', icon: Map },
  { title: 'Cidades', href: '/admin/cities', icon: Building2 },
  { title: 'Usuários', href: '/admin/users', icon: Users },
  { title: 'Habilitações', href: '/admin/habilitations', icon: UserCheck },
  { title: 'Templates de Documentos', href: '/admin/document-templates', icon: Files },
  { title: 'Mensagens de Contato', href: '/admin/contact-messages', icon: MessageSquare },
  { title: 'Perfis (Roles)', href: '/admin/roles', icon: ShieldCheck },
  { title: 'Relatórios', href: '/admin/reports', icon: BarChart },
  { title: 'Configurações', href: '/admin/settings', icon: Settings },
];

const NavButton = ({ item, pathname, onLinkClick }: { item: { href: string; title: string; icon: React.ElementType; disabled?: boolean }; pathname: string; onLinkClick?: () => void; }) => (
  <Button
    key={item.href}
    variant={pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href) && !item.disabled) ? 'secondary' : 'ghost'}
    className={cn(
      'w-full justify-start',
      (pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href)) && !item.disabled) && 'font-semibold text-primary hover:text-primary'
    )}
    asChild
    disabled={item.disabled}
    onClick={onLinkClick}
  >
    <Link href={item.disabled ? '#' : item.href}>
      <item.icon className="mr-2 h-4 w-4" />
      {item.title}
    </Link>
  </Button>
);

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-64 bg-background border-r flex flex-col">
      <div className="p-4 border-b">
        <Link href="/admin/dashboard" className="flex items-center space-x-2">
          <LayoutDashboard className="h-7 w-7 text-primary" />
          <span className="font-bold text-xl text-primary">BidExpert Admin</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
          {topLevelNavItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} />)}
          
          <Accordion type="multiple" className="w-full" defaultValue={['auction-management', 'judicial-management', 'platform-management', 'content-management']}>
              <AccordionItem value="auction-management" className="border-b-0">
                  <AccordionTrigger className="text-xs font-semibold uppercase text-muted-foreground hover:no-underline rounded-md px-3 hover:bg-accent/50">Gestão de Leilões</AccordionTrigger>
                  <AccordionContent className="pt-1 space-y-1">
                      {auctionManagementItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} />)}
                  </AccordionContent>
              </AccordionItem>
               <AccordionItem value="content-management" className="border-b-0">
                  <AccordionTrigger className="text-xs font-semibold uppercase text-muted-foreground hover:no-underline rounded-md px-3 hover:bg-accent/50">Conteúdo e Mídia</AccordionTrigger>
                  <AccordionContent className="pt-1 space-y-1">
                      {contentManagementItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} />)}
                  </AccordionContent>
              </AccordionItem>
              <AccordionItem value="judicial-management" className="border-b-0">
                  <AccordionTrigger className="text-xs font-semibold uppercase text-muted-foreground hover:no-underline rounded-md px-3 hover:bg-accent/50">Gestão Judicial</AccordionTrigger>
                  <AccordionContent className="pt-1 space-y-1">
                      {judicialManagementItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} />)}
                  </AccordionContent>
              </AccordionItem>
              <AccordionItem value="platform-management" className="border-b-0">
                  <AccordionTrigger className="text-xs font-semibold uppercase text-muted-foreground hover:no-underline rounded-md px-3 hover:bg-accent/50">Gestão da Plataforma</AccordionTrigger>
                  <AccordionContent className="pt-1 space-y-1">
                      {platformManagementItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} />)}
                  </AccordionContent>
              </AccordionItem>
          </Accordion>
        </nav>
      </ScrollArea>
      <div className="p-4 border-t">
        <Button variant="outline" className="w-full" asChild>
            <Link href="/">Voltar ao Site</Link>
        </Button>
      </div>
    </aside>
  );
}
