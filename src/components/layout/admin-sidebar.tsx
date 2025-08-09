// src/components/layout/admin-sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ListChecks, Package, Landmark, Users, Settings, LayoutDashboard, Gavel, Map, Building2, Library, ShieldCheck, Layers, Tv, ShoppingCart, Scale, FileText, Boxes, Rocket, FileUp, BarChart, BookOpen, UserCheck, MessageSquare, Files, ClipboardCheck, MapPin, PlusCircle } from 'lucide-react';
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
  { title: 'Listar Leilões', href: '/admin/auctions', icon: Gavel },
  { title: 'Novo Leilão', href: '/admin/auctions/new', icon: PlusCircle },
  { title: 'Análise de Leilões', href: '/admin/auctions/analysis', icon: BarChart },
];

const lotManagementItems = [
    { title: 'Listar Lotes', href: '/admin/lots', icon: ListChecks },
    { title: 'Novo Lote', href: '/admin/lots/new', icon: PlusCircle },
    { title: 'Análise de Lotes', href: '/admin/lots/analysis', icon: BarChart },
    { title: 'Loteamento', href: '/admin/lotting', icon: Boxes },
];


const assetManagementItems = [
    { title: 'Listar Bens', href: '/admin/bens', icon: Package },
    { title: 'Novo Bem', href: '/admin/bens/new', icon: PlusCircle },
    { title: 'Análise de Bens', href: '/admin/bens/analysis', icon: BarChart },
];

const categoryManagementItems = [
    { title: 'Listar Categorias', href: '/admin/categories', icon: ListChecks },
    { title: 'Nova Categoria', href: '/admin/categories/new', icon: PlusCircle },
    { title: 'Análise de Categorias', href: '/admin/categories/analysis', icon: BarChart },
    { title: 'Subcategorias', href: '/admin/subcategories', icon: Layers },
    { title: 'Nova Subcategoria', href: '/admin/subcategories/new', icon: PlusCircle },
];

const locationManagementItems = [
    { title: 'Listar Cidades', href: '/admin/cities', icon: Building2 },
    { title: 'Nova Cidade', href: '/admin/cities/new', icon: PlusCircle },
    { title: 'Análise de Cidades', href: '/admin/cities/analysis', icon: BarChart },
    { title: 'Listar Estados', href: '/admin/states', icon: MapPin },
    { title: 'Novo Estado', href: '/admin/states/new', icon: PlusCircle },
    { title: 'Análise de Estados', href: '/admin/states/analysis', icon: BarChart },
];

const contentManagementItems = [
    { title: 'Blog', href: '/admin/blog', icon: BookOpen, disabled: true },
    { title: 'Biblioteca de Mídia', href: '/admin/media', icon: Library },
]

const judicialManagementItems = [
    { title: 'Listar Tribunais', href: '/admin/courts', icon: Scale },
    { title: 'Novo Tribunal', href: '/admin/courts/new', icon: PlusCircle },
    { title: 'Análise de Tribunais', href: '/admin/courts/analysis', icon: BarChart },
    { title: 'Listar Comarcas', href: '/admin/judicial-districts', icon: Map },
    { title: 'Nova Comarca', href: '/admin/judicial-districts/new', icon: PlusCircle },
    { title: 'Análise de Comarcas', href: '/admin/judicial-districts/analysis', icon: BarChart },
    { title: 'Listar Varas', href: '/admin/judicial-branches', icon: Building2 },
    { title: 'Nova Vara', href: '/admin/judicial-branches/new', icon: PlusCircle },
    { title: 'Análise de Varas', href: '/admin/judicial-branches/analysis', icon: BarChart },
    { title: 'Processos', href: '/admin/judicial-processes', icon: FileText },
    { title: 'Novo Processo', href: '/admin/judicial-processes/new', icon: PlusCircle },
]

const platformManagementItems = [
  { title: 'Habilitações', href: '/admin/habilitations', icon: UserCheck },
  { title: 'Templates de Documentos', href: '/admin/document-templates', icon: Files },
  { title: 'Novo Template', href: '/admin/document-templates/new', icon: PlusCircle },
  { title: 'Mensagens de Contato', href: '/admin/contact-messages', icon: MessageSquare },
  { title: 'Construtor de Relatórios', href: '/admin/report-builder', icon: ClipboardCheck },
  { title: 'Perfis (Roles)', href: '/admin/roles', icon: ShieldCheck },
  { title: 'Novo Perfil', href: '/admin/roles/new', icon: PlusCircle },
  { title: 'Relatórios Gerais', href: '/admin/reports', icon: BarChart },
  { title: 'Testes (QA)', href: '/admin/qa', icon: ClipboardCheck },
  { title: 'Configurações', href: '/admin/settings', icon: Settings },
];

const userManagementItems = [
    { title: 'Listar Usuários', href: '/admin/users', icon: Users },
    { title: 'Novo Usuário', href: '/admin/users/new', icon: PlusCircle },
    { title: 'Análise de Usuários', href: '/admin/users/analysis', icon: BarChart },
];

const sellerManagementItems = [
    { title: 'Listar Comitentes', href: '/admin/sellers', icon: Users },
    { title: 'Novo Comitente', href: '/admin/sellers/new', icon: PlusCircle },
    { title: 'Análise de Comitentes', href: '/admin/sellers/analysis', icon: BarChart },
];

const auctioneerManagementItems = [
    { title: 'Listar Leiloeiros', href: '/admin/auctioneers', icon: Landmark },
    { title: 'Novo Leiloeiro', href: '/admin/auctioneers/new', icon: PlusCircle },
    { title: 'Análise de Leiloeiros', href: '/admin/auctioneers/analysis', icon: BarChart },
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
          
          <Accordion type="multiple" className="w-full" defaultValue={['auction-management', 'lot-management', 'asset-management', 'judicial-management', 'platform-management', 'content-management', 'sellers-management', 'auctioneers-management', 'location-management', 'user-management']}>
              <AccordionItem value="auction-management" className="border-b-0">
                  <AccordionTrigger className="text-xs font-semibold uppercase text-muted-foreground hover:no-underline rounded-md px-3 hover:bg-accent/50">Gestão de Leilões</AccordionTrigger>
                  <AccordionContent className="pt-1 space-y-1">
                      {auctionManagementItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} />)}
                  </AccordionContent>
              </AccordionItem>
              <AccordionItem value="lot-management" className="border-b-0">
                  <AccordionTrigger className="text-xs font-semibold uppercase text-muted-foreground hover:no-underline rounded-md px-3 hover:bg-accent/50">Lotes</AccordionTrigger>
                  <AccordionContent className="pt-1 space-y-1">
                      {lotManagementItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} />)}
                  </AccordionContent>
              </AccordionItem>
               <AccordionItem value="asset-management" className="border-b-0">
                  <AccordionTrigger className="text-xs font-semibold uppercase text-muted-foreground hover:no-underline rounded-md px-3 hover:bg-accent/50">Ativos e Estoque</AccordionTrigger>
                  <AccordionContent className="pt-1 space-y-1">
                      {assetManagementItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} />)}
                  </AccordionContent>
              </AccordionItem>
              <AccordionItem value="category-management" className="border-b-0">
                  <AccordionTrigger className="text-xs font-semibold uppercase text-muted-foreground hover:no-underline rounded-md px-3 hover:bg-accent/50">Conteúdo e Mídia</AccordionTrigger>
                  <AccordionContent className="pt-1 space-y-1">
                      {categoryManagementItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} />)}
                      {contentManagementItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} />)}
                  </AccordionContent>
              </AccordionItem>
              <AccordionItem value="location-management" className="border-b-0">
                  <AccordionTrigger className="text-xs font-semibold uppercase text-muted-foreground hover:no-underline rounded-md px-3 hover:bg-accent/50">Gestão Geográfica</AccordionTrigger>
                  <AccordionContent className="pt-1 space-y-1">
                      {locationManagementItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} />)}
                  </AccordionContent>
              </AccordionItem>
              <AccordionItem value="judicial-management" className="border-b-0">
                  <AccordionTrigger className="text-xs font-semibold uppercase text-muted-foreground hover:no-underline rounded-md px-3 hover:bg-accent/50">Gestão Judicial</AccordionTrigger>
                  <AccordionContent className="pt-1 space-y-1">
                      {judicialManagementItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} />)}
                  </AccordionContent>
              </AccordionItem>
               <AccordionItem value="sellers-management" className="border-b-0">
                  <AccordionTrigger className="text-xs font-semibold uppercase text-muted-foreground hover:no-underline rounded-md px-3 hover:bg-accent/50">Comitentes</AccordionTrigger>
                  <AccordionContent className="pt-1 space-y-1">
                      {sellerManagementItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} />)}
                  </AccordionContent>
              </AccordionItem>
               <AccordionItem value="auctioneers-management" className="border-b-0">
                  <AccordionTrigger className="text-xs font-semibold uppercase text-muted-foreground hover:no-underline rounded-md px-3 hover:bg-accent/50">Leiloeiros</AccordionTrigger>
                  <AccordionContent className="pt-1 space-y-1">
                      {auctioneerManagementItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} />)}
                  </AccordionContent>
              </AccordionItem>
               <AccordionItem value="user-management" className="border-b-0">
                  <AccordionTrigger className="text-xs font-semibold uppercase text-muted-foreground hover:no-underline rounded-md px-3 hover:bg-accent/50">Usuários</AccordionTrigger>
                  <AccordionContent className="pt-1 space-y-1">
                      {userManagementItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} />)}
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
