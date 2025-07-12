
'use client';

import * as React from 'react';
import { icons, type LucideIcon, type LucideProps } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

// Lista expandida de ícones relevantes para um site de leilões
const relevantIconNames = [
  'Landmark', 'Scale', 'Gavel', 'Building', 'Home', 'Car', 'Truck', 'Bus', 'Ship', 'Anchor', 'Warehouse',
  'Factory', 'Wheat', 'Tractor', 'PawPrint', 'Diamond', 'Gem', 'ShoppingCart', 'Tag', 'Ticket', 'Percent',
  'DollarSign', 'Coins', 'Wallet', 'CreditCard', 'FileText', 'FileArchive', 'Folder', 'Package', 'Box',
  'Boxes', 'Computer', 'Laptop', 'Smartphone', 'Tablet', 'Watch', 'HardHat', 'Wrench', 'Hammer', 'Tv',
  'Camera', 'Paperclip', 'MapPin', 'Users', 'User', 'Heart', 'Star', 'Megaphone', 'Badge', 'Shield',
  'TrendingUp', 'BarChart', 'PieChart', 'Settings', 'Info', 'HelpCircle', 'MessageSquare', 'Mail', 'Phone',
  'Globe', 'Link', 'Briefcase', 'BookOpen', 'Palette', 'Utensils', 'Forest', 'Paintbrush', 'ListChecks'
] as (keyof typeof icons)[];


const IconDisplay = ({ name, ...props }: { name: string } & LucideProps) => {
  const IconComponent = icons[name as keyof typeof icons];
  if (!IconComponent) return null;
  return <IconComponent {...props} />;
};

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? (
            <div className="flex items-center gap-2">
              <IconDisplay name={value} className="h-4 w-4" />
              <span>{value}</span>
            </div>
          ) : (
            'Selecione um ícone...'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Buscar ícone..." />
          <CommandList>
            <CommandEmpty>Nenhum ícone encontrado.</CommandEmpty>
            <CommandGroup className="max-h-60 overflow-y-auto">
              {relevantIconNames.map((iconName) => (
                <CommandItem
                  key={iconName}
                  value={iconName}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                >
                  <IconDisplay name={iconName} className="mr-2 h-4 w-4" />
                  <span>{iconName}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
