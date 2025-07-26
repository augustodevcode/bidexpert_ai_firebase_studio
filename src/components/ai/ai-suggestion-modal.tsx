// src/components/ai/ai-suggestion-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb, Wand2, Check } from 'lucide-react';
import type { SuggestListingDetailsOutput } from '@/ai/flows/suggest-listing-details';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Label } from '@/components/ui/label';


interface AISuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fetchSuggestionsAction: () => Promise<SuggestListingDetailsOutput>;
  onApplySuggestions: (suggestions: SuggestListingDetailsOutput) => void;
}

export default function AISuggestionModal({
  isOpen,
  onClose,
  fetchSuggestionsAction,
  onApplySuggestions,
}: AISuggestionModalProps) {
  const [suggestions, setSuggestions] = useState<SuggestListingDetailsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchSuggestions = async () => {
        setIsLoading(true);
        setError(null);
        setSuggestions(null);
        try {
          const result = await fetchSuggestionsAction();
          setSuggestions(result);
        } catch (err: any) {
          setError(err.message || "Não foi possível obter sugestões da IA.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchSuggestions();
    }
  }, [isOpen, fetchSuggestionsAction]);

  const handleApply = () => {
    if (suggestions) {
      onApplySuggestions(suggestions);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Lightbulb className="h-6 w-6 text-primary"/> Sugestões de Conteúdo da IA</DialogTitle>
          <DialogDescription>
            Analisamos os dados do seu leilão e geramos algumas sugestões para otimizar a listagem.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto px-1 pr-4">
            {isLoading && (
                <div className="flex items-center justify-center flex-col gap-3 text-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Analisando e gerando sugestões...</p>
                </div>
            )}
            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Erro ao Gerar Sugestões</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {suggestions && (
                <div className="space-y-4 text-sm">
                    <div className="space-y-1">
                        <Label className="font-semibold text-foreground">Título Sugerido:</Label>
                        <p className="p-2 bg-secondary rounded-md">{suggestions.suggestedTitle}</p>
                    </div>
                     <div className="space-y-1">
                        <Label className="font-semibold text-foreground">Descrição Sugerida:</Label>
                        <p className="p-2 bg-secondary rounded-md whitespace-pre-line">{suggestions.suggestedDescription}</p>
                    </div>
                     <div className="space-y-1">
                        <Label className="font-semibold text-foreground">Palavras-chave Sugeridas:</Label>
                        <p className="p-2 bg-secondary rounded-md text-muted-foreground">{suggestions.suggestedKeywords}</p>
                    </div>
                </div>
            )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button type="button" onClick={handleApply} disabled={isLoading || !suggestions}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Aplicar Sugestões
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}