// src/app/admin/document-templates/document-template-form.tsx
/**
 * @fileoverview Componente de formulário reutilizável para criar e editar
 * Templates de Documentos. Utiliza `react-hook-form` para gerenciar o estado
 * e `zod` para validação. O formulário inclui um editor de texto para o conteúdo
 * HTML e um painel lateral que exibe as variáveis Handlebars disponíveis
 * para o tipo de template selecionado, facilitando a criação de documentos dinâmicos.
 */
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { documentTemplateFormSchema, type DocumentTemplateFormData } from './document-template-form-schema';
import type { DocumentTemplate } from '@/types';
import { Loader2, Save, Files, Code, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

interface DocumentTemplateFormProps {
  initialData?: DocumentTemplate | null;
  onSubmitAction: (data: DocumentTemplateFormData) => Promise<{ success: boolean; message: string; templateId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

const templateTypeOptions = [
  { value: 'WINNING_BID_TERM', label: 'Auto de Arrematação' },
  { value: 'EVALUATION_REPORT', label: 'Laudo de Avaliação' },
  { value: 'AUCTION_CERTIFICATE', label: 'Certificado de Leilão' },
];

const availableVariables = {
    WINNING_BID_TERM: [
        { label: "Título do Lote", value: "{{{lote.titulo}}}"},
        { label: "Número do Lote", value: "{{{lote.numero}}}"},
        { label: "Descrição do Lote", value: "{{{lote.descricao}}}"},
        { label: "Valor do Arremate", value: "{{{lote.valor_arremate}}}"},
        { label: "Leilão", value: "{{{leilao.titulo}}}"},
        { label: "ID Público do Leilão", value: "{{{leilao.id_publico}}}"},
        { label: "Leiloeiro", value: "{{{leiloeiro.nome}}}"},
        { label: "Matrícula do Leiloeiro", value: "{{{leiloeiro.matricula}}}"},
        { label: "Comitente", value: "{{{comitente.nome}}}"},
        { label: "CPF/CNPJ do Comitente", value: "{{{comitente.documento}}}"},
        { label: "Nome do Arrematante", value: "{{{arrematante.nomeCompleto}}}"},
        { label: "CPF/CNPJ do Arrematante", value: "{{{arrematante.cpf}}}"},
        { label: "Endereço do Arrematante", value: "{{{arrematante.endereco}}}"},
        { label: "Data Atual", value: "{{{dataAtual}}}"},
    ],
    EVALUATION_REPORT: [
        { label: "Título do Leilão", value: "{{{leilao.titulo}}}"},
        { label: "ID Público do Leilão", value: "{{{leilao.id_publico}}}"},
        { label: "Leiloeiro", value: "{{{leiloeiro.nome}}}"},
        { label: "Comitente", value: "{{{comitente.nome}}}"},
        { label: "Data da Avaliação", value: "{{{dataAtual}}}"},
        { label: "Lista de Lotes (WIP)", value: "{{#each lotes}}{{/each}}"},
    ],
    AUCTION_CERTIFICATE: [
        { label: "Título do Leilão", value: "{{{leilao.titulo}}}"},
        { label: "Data de Encerramento", value: "{{{leilao.dataFim}}}"},
        { label: "Leiloeiro", value: "{{{leiloeiro.nome}}}"},
        { label: "Comitente", value: "{{{comitente.nome}}}"},
        { label: "Data da Emissão", value: "{{{dataAtual}}}"},
        { label: "Total de Lotes Vendidos", value: "{{{leilao.totalLotesVendidos}}}" },
    ]
};

export default function DocumentTemplateForm({
  initialData, onSubmitAction, formTitle, formDescription, submitButtonText,
}: DocumentTemplateFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<DocumentTemplateFormData>({
    resolver: zodResolver(documentTemplateFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'WINNING_BID_TERM',
      content: initialData?.content || '',
    },
  });
  
  const selectedType = useWatch({ control: form.control, name: 'type' });
  
  const handleCopyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    toast({ title: "Copiado!", description: `A variável ${variable} foi copiada.` });
  };

  async function onSubmit(values: DocumentTemplateFormData) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
        router.push('/admin/document-templates');
        router.refresh();
      } else {
        toast({ title: 'Erro', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro Inesperado', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <Card className="lg:col-span-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Files className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
          <CardDescription>{formDescription}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome do Template</FormLabel><FormControl><Input placeholder="Ex: Auto de Arrematação Padrão" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Tipo de Documento</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl><SelectContent>{templateTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="content" render={({ field }) => (<FormItem><FormLabel>Conteúdo do Template (HTML)</FormLabel><FormControl><Textarea placeholder="Escreva o conteúdo do seu documento aqui. Use as variáveis disponíveis..." {...field} rows={20} className="font-mono text-xs" /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
            <CardFooter className="flex justify-end gap-2 p-6 border-t">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/document-templates')} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{submitButtonText}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

       <Card className="lg:col-span-1 sticky top-24">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Code className="h-5 w-5"/>Variáveis Disponíveis</CardTitle>
          <CardDescription className="text-xs">Clique para copiar as variáveis e cole no editor de conteúdo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
            {(availableVariables[selectedType] || []).map(variable => (
                <div key={variable.value} className="flex items-center justify-between text-xs p-1.5 bg-secondary/50 rounded-md">
                    <span className="font-mono text-muted-foreground">{variable.label}</span>
                    <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCopyVariable(variable.value)}>
                        <Copy className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
