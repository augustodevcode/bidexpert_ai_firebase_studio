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
    Building, MapPin, FileText, PlusCircle, Settings, ShieldCheck, FileSpreadsheet, Briefcase, ServerCrash,
    Loader2
} from 'lucide-react';
import { globalSearch, type SearchResultItem } from '@/app/actions/global-search';

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
  const [query, setQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        onOpenChange(!isOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, onOpenChange]);

  React.useEffect(() => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await globalSearch(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const runCommand = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Digite um comando ou busque uma página..." 
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
            {isSearching ? (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Buscando...
                </div>
            ) : (
                "Nenhum resultado encontrado."
            )}
        </CommandEmpty>
        
        {searchResults.length > 0 && (
            <CommandGroup heading="Resultados da Busca">
                {searchResults.map((result) => (
                    <CommandItem 
                        key={`${result.type}-${result.id}`} 
                        onSelect={() => runCommand(result.url)} 
                        value={`${result.title}-${result.id}`}
                    >
                        {result.type === 'auction' && <Gavel className="mr-2 h-4 w-4" />}
                        {result.type === 'lot' && <ListChecks className="mr-2 h-4 w-4" />}
                        {result.type === 'user' && <Users className="mr-2 h-4 w-4" />}
                        <div className="flex flex-col">
                            <span>{result.title}</span>
                            {result.subtitle && <span className="text-xs text-muted-foreground">{result.subtitle}</span>}
                        </div>
                    </CommandItem>
                ))}
            </CommandGroup>
        )}
        
        {searchResults.length > 0 && <CommandSeparator />}

        <CommandGroup heading="Navegação Principal">
          {mainNavCommands.map(({ href, label, icon: Icon }) => (
            <CommandItem key={href} onSelect={() => runCommand(href)} data-ai-id={`cmd-nav-${label.toLowerCase()}`}>
              <Icon className="mr-2 h-4 w-4" />
              <span>{label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Entidades">
          {entityCommands.map(({ href, label, icon: Icon }) => (
            <CommandItem key={href} onSelect={() => runCommand(href)} data-ai-id={`cmd-entity-${label.toLowerCase()}`}>
              <Icon className="mr-2 h-4 w-4" />
              <span>{label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Gestão Judicial">
          {judicialCommands.map(({ href, label, icon: Icon }) => (
            <CommandItem key={href} onSelect={() => runCommand(href)} data-ai-id={`cmd-judicial-${label.toLowerCase().replace(/ /g, '-')}`}>
              <Icon className="mr-2 h-4 w-4" />
              <span>{label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Administração">
          {settingsCommands.map(({ href, label, icon: Icon }) => (
            <CommandItem key={href} onSelect={() => runCommand(href)} data-ai-id={`cmd-admin-${label.toLowerCase().replace(/ /g, '-')}`}>
              <Icon className="mr-2 h-4 w-4" />
              <span>{label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

      </CommandList>
    </CommandDialog>
  );
}
