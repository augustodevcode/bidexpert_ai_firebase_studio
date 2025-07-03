// src/components/admin/lotting/create-lot-modal.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Bem, Lot } from '@/types';
import { Loader2, Save, PackagePlus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const lotModalFormSchema = z.object({
  number: z.string().min(1, 'O número do lote é obrigatório.'),
  title: z.string().min(5, 'O título é obrigatório e deve ter no mínimo 5 caracteres.'),
  initialPrice: z.coerce.number().positive('O lance inicial deve ser um valor positivo.'),
  bidIncrementStep: z.coerce.number().positive('O incremento deve ser um valor positivo.').optional().nullable(),
});

export type LotFromModalValues = z.infer<typeof lotModalFormSchema>;

interface CreateLotFromBensModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBens: Bem[];
  onLotCreated: (newLotData: Omit<Lot, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'auctionId'>) => void;
}

export default function CreateLotFromBensModal({
  isOpen, onClose, selectedBens, onLotCreated
}: CreateLotFromBensModalProps) {
  const { toast } = useToast();
  
  const totalEvaluationValue = React.useMemo(() => {
    return selectedBens.reduce((sum, bem) => sum + (bem.evaluationValue || 0), 0);
  }, [selectedBens]);
  
  const defaultTitle = selectedBens.length === 1 ? selectedBens[0].title : `Lote Agrupado - ${selectedBens.length} Bens`;

  const form = useForm<LotFromModalValues>({
    resolver: zodResolver(lotModalFormSchema),
    defaultValues: {
      number: '',
      title: defaultTitle,
      initialPrice: totalEvaluationValue > 0 ? totalEvaluationValue : undefined,
      bidIncrementStep: undefined,
    },
  });

  // Sync form defaults if selectedBens change while modal is open (less likely, but safe)
  React.useEffect(() => {
    form.reset({
      number: '',
      title: defaultTitle,
      initialPrice: totalEvaluationValue > 0 ? totalEvaluationValue : undefined,
      bidIncrementStep: undefined,
    });
  }, [selectedBens, defaultTitle, totalEvaluationValue, form]);


  function onSubmit(values: LotFromModalValues) {
    const firstBem = selectedBens[0];
    const newLotData: Omit<Lot, 'id' | 'publicId' | 'createdAt' | 'updatedAt' | 'auctionId'> = {
        ...values,
        bemIds: selectedBens.map(b => b.id),
        status: 'EM_BREVE',
        price: values.initialPrice,
        categoryId: firstBem?.categoryId,
        subcategoryId: firstBem?.subcategoryId,
    };

    onLotCreated(newLotData);
    toast({ title: 'Sucesso!', description: 'Lote preparado e adicionado ao wizard.' });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><PackagePlus /> Criar Novo Lote Agrupado</DialogTitle>
          <DialogDescription>
            Defina os detalhes para o novo lote que conterá os {selectedBens.length} bens selecionados.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="py-4 space-y-4">
              <div className="p-3 bg-secondary/50 rounded-md text-sm">
                <p><strong>Bens Selecionados:</strong> {selectedBens.length}</p>
                <p><strong>Valor de Avaliação Total:</strong> R$ {totalEvaluationValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
              </div>
              <Separator />
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Título do Lote</FormLabel><FormControl><Input placeholder="Ex: Mobiliário de Escritório" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="number" render={({ field }) => (
                  <FormItem><FormLabel>Número do Lote</FormLabel><FormControl><Input placeholder="Ex: 001, A5" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="initialPrice" render={({ field }) => (
                  <FormItem><FormLabel>Lance Inicial (R$)</FormLabel><FormControl><Input type="number" placeholder="Ex: 5000.00" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="bidIncrementStep" render={({ field }) => (
                <FormItem><FormLabel>Incremento Mínimo (R$ - Opcional)</FormLabel><FormControl><Input type="number" placeholder="Ex: 100.00" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Preparar Lote
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
