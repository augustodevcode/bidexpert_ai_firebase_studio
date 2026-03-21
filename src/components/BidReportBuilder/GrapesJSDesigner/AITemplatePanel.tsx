// src/components/BidReportBuilder/GrapesJSDesigner/AITemplatePanel.tsx
/**
 * @fileoverview Painel de geração de templates via IA para o GrapesJS Designer.
 * Permite ao usuário descrever ou enviar um documento para gerar automaticamente
 * um template HTML com variáveis Handlebars no tom formal-jurídico.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Wand2, Upload, FileText, Loader2, ChevronDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ReportContextType } from '@/lib/report-builder/schemas/auction-context.schema';

// ============================================================================
// TYPES
// ============================================================================

interface AIGenerateResult {
  html: string;
  css: string;
  description: string;
  variables: Array<{ path: string; label: string; type: string }>;
  suggestedName: string;
}

interface AITemplatePanelProps {
  contextType: ReportContextType;
  onTemplateGenerated: (result: AIGenerateResult) => void;
  className?: string;
}

type Tone = 'FORMAL_JURIDICO' | 'TECNICO' | 'COMERCIAL';

const TONE_LABELS: Record<Tone, string> = {
  FORMAL_JURIDICO: 'Formal Jurídico',
  TECNICO: 'Técnico',
  COMERCIAL: 'Comercial',
};

const CONTEXT_LABELS: Record<ReportContextType, string> = {
  AUCTION: 'Leilão',
  LOT: 'Lote',
  BIDDER: 'Arrematante',
  COURT_CASE: 'Processo Judicial',
  AUCTION_RESULT: 'Resultado de Leilão',
  APPRAISAL_REPORT: 'Laudo de Avaliação',
  INVOICE: 'Nota de Arrematação',
};

const EXAMPLE_PROMPTS: Record<ReportContextType, string> = {
  AUCTION:
    'Edital de leilão judicial com cabeçalho oficial, informações do leiloeiro, lista de lotes com valores mínimos, condições de participação e assinatura.',
  LOT:
    'Ficha técnica do lote com foto, descrição detalhada, localização, valor de avaliação, lances mínimos e condições de venda.',
  BIDDER:
    'Carta de confirmação de habilitação para o arrematante com dados cadastrais, número de inscrição e instruções para o dia do leilão.',
  COURT_CASE:
    'Ofício judicial dirigido ao juízo com número do processo, partes, objeto e pedido de homologação de arrematação.',
  AUCTION_RESULT:
    'Ata de resultado de leilão com lista completa de lotes, valores arrematados, nomes dos arrematantes e totalizadores.',
  APPRAISAL_REPORT:
    'Laudo técnico de avaliação com identificação do bem, metodologia, fotos, valores e assinatura do avaliador.',
  INVOICE:
    'Nota de arrematação com dados do comprador, vendedor, descrição do bem, valor total, comissões e instruções de pagamento.',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function AITemplatePanel({
  contextType,
  onTemplateGenerated,
  className,
}: AITemplatePanelProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [aiProviderLabel, setAiProviderLabel] = useState<string | null>(null);
  const [aiProviderHealthy, setAiProviderHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/ai/status')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setAiProviderLabel(data.label as string);
          if (data.ollamaHealthy !== undefined) {
            setAiProviderHealthy(data.ollamaHealthy as boolean);
          }
        }
      })
      .catch(() => null);
  }, []);

  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<Tone>('FORMAL_JURIDICO');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AIGenerateResult | null>(null);
  const [showVariables, setShowVariables] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Tipo de arquivo não suportado',
        description: 'Envie um arquivo .docx, .doc, .txt ou .pdf',
        variant: 'destructive',
      });
      return;
    }

    try {
      let text = '';

      if (file.type === 'text/plain') {
        text = await file.text();
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
      ) {
        // Use FormData to send to extraction endpoint
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/reports/extract-text', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          // Fallback: read as plain text (may not decode correctly for binary)
          toast({
            title: 'Extração parcial',
            description:
              'Não foi possível extrair o texto completo do Word. Use um arquivo .txt como alternativa.',
            variant: 'default',
          });
          return;
        }

        const data = await response.json();
        text = data.text || '';
      } else if (file.type === 'application/pdf') {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/reports/extract-text', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          toast({
            title: 'Extração parcial',
            description: 'Não foi possível extrair o texto do PDF. Use um arquivo .txt como alternativa.',
            variant: 'default',
          });
          return;
        }

        const data = await response.json();
        text = data.text || '';
      }

      setDocumentText(text);
      setUploadedFileName(file.name);
      toast({
        title: 'Documento carregado',
        description: `"${file.name}" será usado como referência para a IA.`,
      });
    } catch (err) {
      console.error('Erro ao ler arquivo:', err);
      toast({
        title: 'Erro ao ler arquivo',
        description: 'Não foi possível processar o documento.',
        variant: 'destructive',
      });
    }

    // Reset input so same file can be re-uploaded
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Descrição necessária',
        description: 'Descreva o template que deseja gerar.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/reports/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextType,
          prompt: prompt.trim(),
          documentText: documentText || undefined,
          tone,
          language: 'pt-BR',
          pageSize: 'A4',
          orientation: 'portrait',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao gerar template');
      }

      const result: AIGenerateResult = data.data;
      setLastResult(result);
      onTemplateGenerated(result);

      toast({
        title: 'Template gerado!',
        description: result.suggestedName || 'Template aplicado ao editor.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao gerar template';
      toast({ title: 'Erro na geração', description: message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExamplePrompt = () => {
    setPrompt(EXAMPLE_PROMPTS[contextType]);
  };

  const handleClearDocument = () => {
    setDocumentText(null);
    setUploadedFileName(null);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      className={`flex flex-col gap-3 p-3 ${className || ''}`}
      data-ai-id="ai-template-panel"
    >
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <Wand2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Geração com IA</span>
        <Badge variant="secondary" className="text-xs">
          {CONTEXT_LABELS[contextType]}
        </Badge>
        {aiProviderLabel && (
          <Badge
            variant={aiProviderHealthy === false ? 'destructive' : 'outline'}
            className="text-xs ml-auto"
            title={aiProviderHealthy === false ? 'Ollama offline — verifique se o serviço está rodando' : undefined}
            data-ai-id="ai-provider-badge"
          >
            {aiProviderHealthy === false ? '⚠ ' : '✓ '}{aiProviderLabel}
          </Badge>
        )}
      </div>

      {/* Document Upload */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">
          Documento de referência (opcional)
        </Label>
        {uploadedFileName ? (
          <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/50">
            <FileText className="h-3 w-3 text-primary shrink-0" />
            <span className="text-xs truncate flex-1">{uploadedFileName}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
              onClick={handleClearDocument}
              aria-label="Remover documento"
            >
              ×
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-3 w-3" />
            Enviar .docx / .pdf / .txt
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.doc,.txt,.pdf"
          className="hidden"
          onChange={handleFileUpload}
          aria-label="Upload de documento para análise"
        />
      </div>

      {/* Tone Selection */}
      <div className="space-y-1">
        <Label htmlFor="ai-tone-select" className="text-xs text-muted-foreground">
          Tom do documento
        </Label>
        <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
          <SelectTrigger id="ai-tone-select" className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(TONE_LABELS) as [Tone, string][]).map(([key, label]) => (
              <SelectItem key={key} value={key} className="text-xs">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Prompt */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="ai-prompt" className="text-xs text-muted-foreground">
            Descreva o template
          </Label>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-xs text-primary p-0"
            onClick={handleExamplePrompt}
          >
            Usar exemplo
          </Button>
        </div>
        <Textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.substring(0, 1000))}
          placeholder={`Descreva o ${CONTEXT_LABELS[contextType].toLowerCase()} que deseja gerar...`}
          className="text-xs resize-none"
          rows={4}
          maxLength={1000}
          aria-label="Descrição do template"
        />
        <p className="text-[10px] text-muted-foreground">
          {prompt.length} / 1.000 caracteres
        </p>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full"
        size="sm"
        data-ai-id="ai-generate-template-button"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
            Gerando template...
          </>
        ) : (
          <>
            <Wand2 className="h-3 w-3 mr-2" />
            Gerar Template
          </>
        )}
      </Button>

      {/* Result: Variables used */}
      {lastResult && (
        <Collapsible open={showVariables} onOpenChange={setShowVariables}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs h-7"
            >
              <span className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                Variáveis utilizadas ({lastResult.variables.length})
              </span>
              <ChevronDown
                className={`h-3 w-3 transition-transform ${showVariables ? 'rotate-180' : ''}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ScrollArea className="h-40 rounded-md border p-2">
              <div className="space-y-1">
                {lastResult.variables.map((v) => (
                  <div key={v.path} className="flex items-start gap-2 text-xs">
                    <code className="text-primary bg-muted px-1 rounded text-[10px] shrink-0 mt-0.5">
                      {`{{${v.path}}}`}
                    </code>
                    <div className="min-w-0">
                      <span className="text-foreground">{v.label}</span>
                      <span className="text-muted-foreground ml-1">({v.type})</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Last generated name */}
      {lastResult?.suggestedName && (
        <p className="text-[10px] text-muted-foreground text-center">
          Último gerado: <em>{lastResult.suggestedName}</em>
        </p>
      )}
    </div>
  );
}

export default AITemplatePanel;
