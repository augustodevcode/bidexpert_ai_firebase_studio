// src/components/layout/admin-sidebar.tsx
/**
 * @fileoverview Barra lateral de navegação para o painel de administração principal.
 * Este componente renderiza os links de navegação para todas as seções de
 * gerenciamento da plataforma, como leilões, usuários, configurações, etc.
 * Utiliza um componente Accordion para organizar os links em grupos expansíveis.
 * É projetado para ser usado exclusivamente dentro do AdminLayout.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ListChecks, Package, Landmark, Users, Settings, LayoutDashboard, Gavel, Map, 
  Building2, Library, ShieldCheck, Layers, Tv, ShoppingCart, Scale, FileText, 
  Boxes, Rocket, FileUp, BarChart3, BookOpen, UserCheck, MessageSquare, Files, 
  ClipboardCheck, MapPin, PlusCircle, FileSpreadsheet, Briefcase, Menu, ServerCrash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import Image from 'next/image';

const topLevelNavItems = [
  { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Auditório Virtual', href: '/live-dashboard', icon: Tv },
  { title: 'Assistente de Leilão', href: '/admin/wizard', icon: Rocket },
];

const managementNavGroups = [
    { 
        groupTitle: 'Gestão de Leilões',
        items: [
            { title: 'Leilões', href: '/admin/auctions', icon: Gavel },
            { title: 'Lotes', href: '/admin/lots', icon: ListChecks },
            { title: 'Ativos (Bens)', href: '/admin/assets', icon: Package },
            { title: 'Loteamento', href: '/admin/lotting', icon: Boxes },
        ]
    },
    { 
        groupTitle: 'Participantes',
        items: [
            { title: 'Comitentes', href: '/admin/sellers', icon: Users },
            { title: 'Leiloeiros', href: '/admin/auctioneers', icon: Landmark },
            { title: 'Usuários', href: '/admin/users', icon: Users },
            { title: 'Habilitações', href: '/admin/habilitations', icon: UserCheck },
        ]
    },
     { 
        groupTitle: 'Gestão Judicial',
        items: [
            { title: 'Processos', href: '/admin/judicial-processes', icon: FileText },
            { title: 'Varas', href: '/admin/judicial-branches', icon: Building2 },
            { title: 'Comarcas', href: '/admin/judicial-districts', icon: Map },
            { title: 'Tribunais', href: '/admin/courts', icon: Scale },
            { title: 'Importação CNJ', href: '/admin/import/cnj', icon: FileUp },
        ]
    },
     { 
        groupTitle: 'Catálogo e Mídia',
        items: [
            { title: 'Categorias', href: '/admin/categories', icon: ListChecks },
            { title: 'Subcategorias', href: '/admin/subcategories', icon: Layers },
            { title: 'Biblioteca de Mídia', href: '/admin/media', icon: Library },
        ]
    },
];

const reportsNavItems = [
    { title: 'Relatórios Gerais', href: '/admin/reports', icon: BarChart3 },
    { title: 'Análise de Leilões', href: '/admin/auctions/analysis', icon: BarChart3 },
    { title: 'Análise de Lotes', href: '/admin/lots/analysis', icon: BarChart3 },
    { title: 'Análise de Comitentes', href: '/admin/sellers/analysis', icon: BarChart3 },
    { title: 'Análise de Leiloeiros', href: '/admin/auctioneers/analysis', icon: BarChart3 },
    { title: 'Análise de Usuários', href: '/admin/users/analysis', icon: BarChart3 },
];

const platformNavItems = [
    { title: 'Perfis (Roles)', href: '/admin/roles', icon: ShieldCheck },
    { title: 'Templates de Documentos', href: '/admin/document-templates', icon: Files },
    { title: 'Mensagens de Contato', href: '/admin/contact-messages', icon: MessageSquare },
    { title: 'Auditoria de Dados', href: '/admin/reports/audit', icon: ServerCrash },
    { title: 'Testes (QA)', href: '/admin/qa', icon: ClipboardCheck },
    { title: 'Configurações', href: '/admin/settings', icon: Settings },
];


const NavButton = ({ item, pathname, onLinkClick }: { item: { href: string; title: string; icon: React.ElementType; disabled?: boolean }; pathname: string; onLinkClick?: () => void; }) => (
  <Button
    key={item.href}
    variant={pathname.startsWith(item.href) && (item.href !== '/admin/dashboard' || pathname === item.href) ? 'secondary' : 'ghost'}
    className={cn(
      'w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-9 text-sm',
      pathname.startsWith(item.href) && (item.href !== '/admin/dashboard' || pathname === item.href) && 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground'
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

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
    const pathname = usePathname();
    
    // Determine which accordion items should be open by default
    const defaultOpenAccordionItems = useMemo(() => {
        const openItems: string[] = [];
        if (managementNavGroups.some(g => g.items.some(i => pathname.startsWith(i.href)))) {
            openItems.push('management');
        }
        if (reportsNavItems.some(i => pathname.startsWith(i.href))) {
            openItems.push('reports');
        }
        if (platformNavItems.some(i => pathname.startsWith(i.href))) {
            openItems.push('platform');
        }
        return openItems;
    }, [pathname]);

    return (
        <>
            <div className="p-4 border-b border-sidebar-border">
                <Link href="/admin/dashboard" className="flex items-center space-x-2">
                <Image src="/logo.svg" alt="BidExpert Logo" width={40} height={40} />
                <span className="font-bold text-xl text-sidebar-foreground">BidExpert</span>
                </Link>
            </div>
            <ScrollArea className="flex-1">
                <nav className="p-2 space-y-2">
                    {topLevelNavItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} onLinkClick={onLinkClick} />)}
                    
                    <Accordion type="multiple" className="w-full" defaultValue={defaultOpenAccordionItems}>
                        <AccordionItem value="management" className="border-b-0">
                            <AccordionTrigger className="text-xs font-semibold uppercase text-muted-foreground hover:no-underline rounded-md px-3 py-2 hover:bg-sidebar-accent">
                                Gerenciamento
                            </AccordionTrigger>
                            <AccordionContent className="pt-1 space-y-1">
                                 {managementNavGroups.map(group => (
                                     <Accordion type="single" collapsible key={group.groupTitle} defaultValue={group.items.some(i => pathname.startsWith(i.href)) ? group.groupTitle : undefined}>
                                         <AccordionItem value={group.groupTitle} className="border-b-0">
                                            <AccordionTrigger className="text-sm font-medium text-sidebar-foreground/80 hover:no-underline rounded-md px-3 py-1.5 hover:bg-sidebar-accent">
                                                {group.groupTitle}
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-1 space-y-1 pl-4 border-l border-sidebar-border ml-3">
                                                 {group.items.map((item) => <NavButton key={item.href} item={item} pathname={pathname} onLinkClick={onLinkClick} />)}
                                            </AccordionContent>
                                         </AccordionItem>
                                     </Accordion>
                                 ))}
                            </AccordionContent>
                        </AccordionItem>

                         <AccordionItem value="reports" className="border-b-0">
                            <AccordionTrigger className="text-xs font-semibold uppercase text-muted-foreground hover:no-underline rounded-md px-3 py-2 hover:bg-sidebar-accent">
                                Análise e Relatórios
                            </AccordionTrigger>
                            <AccordionContent className="pt-1 space-y-1">
                                {reportsNavItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} onLinkClick={onLinkClick} />)}
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="platform" className="border-b-0">
                            <AccordionTrigger className="text-xs font-semibold uppercase text-muted-foreground hover:no-underline rounded-md px-3 py-2 hover:bg-sidebar-accent">
                                Plataforma
                            </AccordionTrigger>
                            <AccordionContent className="pt-1 space-y-1">
                                {platformNavItems.map((item) => <NavButton key={item.href} item={item} pathname={pathname} onLinkClick={onLinkClick} />)}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </nav>
            </ScrollArea>
        </>
    );
}

export default function AdminSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[300px] p-0 flex flex-col bg-sidebar text-sidebar-foreground md:hidden">
          <SidebarContent onLinkClick={() => setIsMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="sticky top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex-col hidden md:flex">
         <SidebarContent />
      </aside>
    </>
  );
}
