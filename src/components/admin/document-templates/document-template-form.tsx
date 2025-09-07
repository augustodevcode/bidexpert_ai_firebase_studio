// src/components/admin/document-templates/document-template-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { DocumentTemplate } from '@/types';
import { documentTemplateFormSchema, type DocumentTemplateFormData } from '@/app/admin/document-templates/document-template-form-schema';
import { Code, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface DocumentTemplateFormProps {
  initialData?: DocumentTemplate | null;
  onSubmitAction: (data: DocumentTemplateFormData) => Promise<any>;
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

const DocumentTemplateForm = React.forwardRef<any, DocumentTemplateFormProps>(({ initialData, onSubmitAction }, ref) => {
  const { toast } = useToast();

  const form = useForm<DocumentTemplateFormData>({
    resolver: zodResolver(documentTemplateFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'WINNING_BID_TERM',
      content: initialData?.content || '',
    },
  });
  
  React.useEffect(() => {
    form.reset({
      name: initialData?.name || '',
      type: initialData?.type || 'WINNING_BID_TERM',
      content: initialData?.content || '',
    });
  }, [initialData, form]);

  React.useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmitAction),
  }));

  const selectedType = useWatch({ control: form.control, name: 'type' });
  
  const handleCopyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    toast({ title: "Copiado!", description: `A variável ${variable} foi copiada.` });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitAction)} className="lg:col-span-2 space-y-6">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome do Template</FormLabel><FormControl><Input placeholder="Ex: Auto de Arrematação Padrão" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Tipo de Documento</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl><SelectContent>{templateTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="content" render={({ field }) => (<FormItem><FormLabel>Conteúdo do Template (HTML)</FormLabel><FormControl><Textarea placeholder="Escreva o conteúdo do seu documento aqui. Use as variáveis disponíveis..." {...field} rows={20} className="font-mono text-xs" /></FormControl><FormMessage /></FormItem>)} />
        </form>
      </Form>

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
});

DocumentTemplateForm.displayName = 'DocumentTemplateForm';
export default DocumentTemplateForm;
