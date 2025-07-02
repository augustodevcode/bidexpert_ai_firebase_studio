
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
import type { Bem, Lot, Auction } from '@/types';
import { Loader2, Save, PackagePlus, DollarSign } from 'lucide-react';
import { createLotWithBens } from '@/app/admin/lots/actions';
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
  auctionId: string;
  sellerName?: string | null;
  sellerId?: string | null;
  onLotCreated: () => void;
}

export default function CreateLotFromBensModal({
  isOpen, onClose, selectedBens, auctionId, sellerName, sellerId, onLotCreated
}: CreateLotFromBensModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
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

  async function onSubmit(values: LotFromModalValues) {
    setIsSubmitting(true);
    const bemIds = selectedBens.map(b => b.id);
    try {
      const result = await createLotWithBens(values, bemIds, auctionId, sellerId, '', sellerName); // auction/seller name can be fetched in action if needed
      if (result.success) {
        toast({ title: 'Sucesso!', description: 'Lote criado com sucesso.' });
        onLotCreated();
        onClose();
      } else {
        toast({ title: 'Erro', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro Inesperado', description: 'Ocorreu um erro ao criar o lote.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><PackagePlus /> Criar Novo Lote a partir de Bens</DialogTitle>
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
                <p><strong>Comitente/Vendedor:</strong> {sellerName || 'Não especificado'}</p>
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
                  <FormItem><FormLabel>Lance Inicial (R$)</FormLabel><FormControl><Input type="number" placeholder="Ex: 5000.00" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="bidIncrementStep" render={({ field }) => (
                <FormItem><FormLabel>Incremento Mínimo (R$ - Opcional)</FormLabel><FormControl><Input type="number" placeholder="Ex: 100.00" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Criar e Lotear
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
