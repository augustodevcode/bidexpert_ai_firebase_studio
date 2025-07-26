// src/components/ai/data-validation-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Check, Wand2, Bot, Trash2 } from 'lucide-react';
import type { ExtractProcessDataOutput } from '@/ai/flows/extract-process-data-flow';
import type { ProcessParty, ProcessPartyType } from '@/types';
import { Separator } from '@/components/ui/separator';

interface DataValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedData: ExtractProcessDataOutput | null;
  onApply: (validatedData: ExtractProcessDataOutput) => void;
}

const partyTypeOptions: { value: ProcessPartyType; label: string }[] = [
    { value: 'AUTOR', label: 'Autor / Exequente' }, { value: 'REU', label: 'Réu / Executado' },
    { value: 'ADVOGADO_AUTOR', label: 'Advogado (Autor)' }, { value: 'ADVOGADO_REU', label: 'Advogado (Réu)' },
    { value: 'JUIZ', label: 'Juiz(a)' }, { value: 'ESCRIVAO', label: 'Escrivão(ã)' },
    { value: 'PERITO', label: 'Perito(a)' }, { value: 'ADMINISTRADOR_JUDICIAL', label: 'Administrador Judicial' },
    { value: 'TERCEIRO_INTERESSADO', label: 'Terceiro Interessado' }, { value: 'OUTRO', label: 'Outro' },
];


export default function DataValidationModal({
  isOpen,
  onClose,
  extractedData,
  onApply,
}: DataValidationModalProps) {
  const [formData, setFormData] = useState<ExtractProcessDataOutput | null>(extractedData);

  useEffect(() => {
    setFormData(extractedData);
  }, [extractedData]);

  const handleInputChange = (field: keyof ExtractProcessDataOutput, value: string) => {
    if (formData) {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handlePartyChange = (index: number, field: keyof ProcessParty, value: string) => {
    if (formData && formData.parties) {
      const newParties = [...formData.parties];
      // @ts-ignore
      newParties[index][field] = value;
      setFormData({ ...formData, parties: newParties });
    }
  };
  
  const handleRemoveParty = (index: number) => {
    if (formData && formData.parties) {
        const newParties = formData.parties.filter((_, i) => i !== index);
        setFormData({ ...formData, parties: newParties });
    }
  }


  const handleApplyClick = () => {
    if (formData) {
      onApply(formData);
    }
  };

  if (!isOpen || !formData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Bot className="h-6 w-6 text-primary"/> Validar Dados Extraídos por IA</DialogTitle>
          <DialogDescription>
            Revise, edite e aprove as informações extraídas do documento. As informações aprovadas preencherão o formulário de cadastro.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6 flex-grow min-h-0 overflow-hidden">
          {/* Left Panel: Form */}
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4">
                <div><Label htmlFor="processNumber">Número do Processo</Label><Input id="processNumber" value={formData.processNumber || ''} onChange={(e) => handleInputChange('processNumber', e.target.value)} /></div>
                <div><Label htmlFor="courtName">Tribunal</Label><Input id="courtName" value={formData.courtName || ''} onChange={(e) => handleInputChange('courtName', e.target.value)} /></div>
                <div><Label htmlFor="districtName">Comarca</Label><Input id="districtName" value={formData.districtName || ''} onChange={(e) => handleInputChange('districtName', e.target.value)} /></div>
                <div><Label htmlFor="branchName">Vara</Label><Input id="branchName" value={formData.branchName || ''} onChange={(e) => handleInputChange('branchName', e.target.value)} /></div>
                
                <Separator />
                
                <h4 className="font-semibold text-md">Partes Envolvidas</h4>
                <div className="space-y-3">
                {formData.parties?.map((party, index) => (
                    <div key={index} className="p-3 border rounded-md space-y-2 bg-secondary/50">
                        <div className="flex justify-end"><Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveParty(index)}><Trash2 className="h-4 w-4"/></Button></div>
                        <div><Label>Nome</Label><Input value={party.name} onChange={(e) => handlePartyChange(index, 'name', e.target.value)} /></div>
                        <div>
                            <Label>Tipo</Label>
                            <Select value={party.partyType} onValueChange={(value) => handlePartyChange(index, 'partyType', value)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>{partyTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                ))}
                </div>
            </div>
          </ScrollArea>
          
          {/* Right Panel: Raw Text */}
          <ScrollArea className="h-full pr-4">
             <div className="space-y-2">
                <Label className="font-semibold">Texto Bruto Extraído (OCR)</Label>
                <Textarea
                    readOnly
                    value={formData.rawText || 'Nenhum texto extraído.'}
                    className="h-full min-h-[400px] text-xs bg-muted/50 font-mono"
                />
             </div>
          </ScrollArea>
        </div>

        <DialogFooter className="mt-auto pt-4 border-t flex-shrink-0">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={handleApplyClick}>
            <Check className="mr-2 h-4 w-4" /> Aplicar Dados Validados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
