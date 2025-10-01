// src/components/layout/command-palette.tsx
'use client';

import * as React from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useRouter } from 'next/navigation';
import { 
    LayoutDashboard, Gavel, ListChecks, Package, Users, Landmark, Scale, 
    Building, MapPin, FileText, PlusCircle, Settings, ShieldCheck, FileSpreadsheet, Briefcase, ServerCrash 
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommandItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
}

const mainNavCommands: CommandItemProps[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: Gavel, label: 'Leilões', href: '/admin/auctions' },
    { icon: ListChecks, label: 'Lotes', href: '/admin/lots' },
    { icon: Package, label: 'Ativos (Bens)', href: '/admin/assets' },
];

const entityCommands: CommandItemProps[] = [
    { icon: Users, label: 'Usuários', href: '/admin/users' },
    { icon: Landmark, label: 'Leiloeiros', href: '/admin/auctioneers' },
    { icon: Briefcase, label: 'Comitentes', href: '/admin/sellers' },
];

const judicialCommands: CommandItemProps[] = [
    { icon: FileText, label: 'Processos Judiciais', href: '/admin/judicial-processes' },
    { icon: Scale, label: 'Tribunais', href: '/admin/courts' },
    { icon: Building, label: 'Comarcas', href: '/admin/judicial-districts' },
    { icon: MapPin, label: 'Varas', href: '/admin/judicial-branches' },
];

const settingsCommands: CommandItemProps[] = [
    { icon: ShieldCheck, label: 'Perfis e Permissões', href: '/admin/roles' },
    { icon: Settings, label: 'Configurações da Plataforma', href: '/admin/settings' },
    { icon: FileSpreadsheet, label: 'Construtor de Relatórios', href: '/admin/report-builder' },
    { icon: ServerCrash, label: 'Auditoria de Dados', href: '/admin/reports/audit' },
];

export default function CommandPalette({ isOpen, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(!isOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, onOpenChange]);

  const runCommand = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Digite um comando ou busque uma página..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        
        <CommandGroup heading="Navegação Principal">
          {mainNavCommands.map(({ href, label, icon: Icon }) => (
            <CommandItem key={href} onSelect={() => runCommand(href)}>
              <Icon className="mr-2 h-4 w-4" />
              <span>{label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Entidades">
          {entityCommands.map(({ href, label, icon: Icon }) => (
            <CommandItem key={href} onSelect={() => runCommand(href)}>
              <Icon className="mr-2 h-4 w-4" />
              <span>{label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Gestão Judicial">
          {judicialCommands.map(({ href, label, icon: Icon }) => (
            <CommandItem key={href} onSelect={() => runCommand(href)}>
              <Icon className="mr-2 h-4 w-4" />
              <span>{label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Administração">
          {settingsCommands.map(({ href, label, icon: Icon }) => (
            <CommandItem key={href} onSelect={() => runCommand(href)}>
              <Icon className="mr-2 h-4 w-4" />
              <span>{label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

      </CommandList>
    </CommandDialog>
  );
}
