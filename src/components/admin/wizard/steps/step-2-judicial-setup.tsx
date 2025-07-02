
'use client';

import { useEffect, useState } from 'react';
import { useWizard } from '../wizard-context';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import type { JudicialProcess } from '@/types';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Loader2, FileText, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function Step2JudicialSetup() {
  const { wizardData, setWizardData } = useWizard();
  const [processes, setProcesses] = useState<JudicialProcess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const fetchedProcesses = await getJudicialProcesses();
      setProcesses(fetchedProcesses);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const selectedProcess = wizardData.judicialProcess;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Selecione o Processo Judicial</h3>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full sm:w-[350px] justify-between"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : selectedProcess ? (
                <span className="truncate">{selectedProcess.processNumber}</span>
              ) : (
                "Selecione um processo..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full sm:w-[350px] p-0">
            <Command>
              <CommandInput placeholder="Buscar por número do processo..." />
              <CommandEmpty>Nenhum processo encontrado.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {processes.map((process) => (
                    <CommandItem
                      key={process.id}
                      value={process.processNumber}
                      onSelect={() => {
                        setWizardData((prev) => ({ ...prev, judicialProcess: process }));
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedProcess?.id === process.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {process.processNumber}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button variant="secondary" asChild>
            <Link href="/admin/judicial-processes/new" target="_blank">
                <PlusCircle className="mr-2 h-4 w-4"/>
                Cadastrar Novo Processo
            </Link>
        </Button>
      </div>

      {selectedProcess && (
        <div className="p-4 border rounded-lg bg-secondary/50 space-y-2">
            <h4 className="font-semibold text-md">Detalhes do Processo Selecionado</h4>
            <p className="text-sm"><strong className="text-muted-foreground">Nº do Processo:</strong> {selectedProcess.processNumber}</p>
            <p className="text-sm"><strong className="text-muted-foreground">Vara:</strong> {selectedProcess.branchName}</p>
            <p className="text-sm"><strong className="text-muted-foreground">Comarca:</strong> {selectedProcess.districtName}</p>
            <p className="text-sm"><strong className="text-muted-foreground">Partes:</strong> {selectedProcess.parties.map(p => p.name).join(', ')}</p>
            <p className="text-sm"><strong className="text-muted-foreground">Bens no Processo:</strong> Em breve...</p>
        </div>
      )}
    </div>
  );
}
