// src/components/ui/entity-selector.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, PlusCircle, Pencil, X, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface EntitySelectorProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  searchPlaceholder: string;
  emptyStateMessage: string;
  createNewUrl: string;
  editUrlPrefix: string;
  onRefetch: () => void;
  isFetching?: boolean;
  disabled?: boolean;
}

export default function EntitySelector({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyStateMessage,
  createNewUrl,
  editUrlPrefix,
  onRefetch,
  isFetching = false,
  disabled = false,
}: EntitySelectorProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className="flex items-center gap-1.5">
        <Popover open={open} onOpenChange={setOpen}>
            <div className="relative flex items-center w-full">
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between pr-14" // Add padding to the right for the icons
                        disabled={disabled}
                    >
                        <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        <ChevronsUpDown className="absolute right-3 ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                 <div className="absolute right-12 flex items-center pr-1">
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onRefetch} disabled={disabled || isFetching} title="Atualizar lista">
                        {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" asChild disabled={disabled}>
                        <Link href={createNewUrl} target="_blank" title="Adicionar novo registro">
                        <PlusCircle className="h-4 w-4" />
                        </Link>
                    </Button>
                    {/* Conditional rendering for the edit link */}
                    {value ? (
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" asChild disabled={disabled}>
                            <Link href={`${editUrlPrefix}/${value}`} target="_blank" title="Editar registro selecionado">
                                <Pencil className="h-4 w-4" />
                            </Link>
                        </Button>
                    ) : (
                         <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={true} title="Selecione um item para editar">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                     <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange(null)} disabled={!value || disabled} title="Limpar seleção">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
             <PopoverContent className="w-full p-0" style={{ minWidth: 'var(--radix-popover-trigger-width)' }}>
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                    <CommandEmpty>{emptyStateMessage}</CommandEmpty>
                    <CommandGroup>
                        {options.map((option) => (
                        <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => {
                            onChange(option.value);
                            setOpen(false);
                            }}
                        >
                            <Check
                            className={cn(
                                "mr-2 h-4 w-4",
                                value === option.value ? "opacity-100" : "opacity-0"
                            )}
                            />
                            {option.label}
                        </CommandItem>
                        ))}
                    </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    </div>
  );
}