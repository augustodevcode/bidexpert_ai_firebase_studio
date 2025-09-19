
"use client"

import * as React from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Button } from "./button"
import { Copy, Check, BrainCircuit, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { analyzeErrorLogAction } from "@/app/admin/qa/actions"
import { Alert, AlertDescription, AlertTitle } from "./alert"
import { ScrollArea } from "./scroll-area" // Importando a ScrollArea

// Helper function to recursively extract text content from React nodes
const getTextContent = (node: React.ReactNode): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (node === null || typeof node === 'boolean' || node === undefined) return '';

  if (Array.isArray(node)) {
    return node.map(getTextContent).join('');
  }

  if (React.isValidElement(node) && node.props.children) {
    return getTextContent(node.props.children);
  }

  return '';
};


function AIAnalysisModal({ errorLog, isOpen, onOpenChange }: { errorLog: string; isOpen: boolean; onOpenChange: (open: boolean) => void; }) {
  const [analysisResult, setAnalysisResult] = React.useState<{ analysis: string; recommendation: string } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasCopiedForAI, setHasCopiedForAI] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setAnalysisResult(null);
      setHasCopiedForAI(false); // Reset copy status when modal opens
      analyzeErrorLogAction(errorLog)
        .then(result => {
          if (result.success) {
            setAnalysisResult({ analysis: result.analysis, recommendation: result.recommendation });
          } else {
            setAnalysisResult({ analysis: 'Falha na Análise', recommendation: 'Não foi possível analisar este erro.' });
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, errorLog]);

  const handleCopyToClipboard = () => {
    if (!analysisResult) return;
    const textToCopy = `**[Análise da IA]**\n\n**Causa Raiz:**\n${analysisResult.analysis}\n\n**Recomendação:**\n${analysisResult.recommendation}`;
    navigator.clipboard.writeText(textToCopy);
    setHasCopiedForAI(true);
    toast({ title: "Copiado!", description: "A análise foi copiada para a área de transferência."});
    setTimeout(() => setHasCopiedForAI(false), 2500);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BrainCircuit className="h-6 w-6 text-primary"/> Análise do Erro com IA</DialogTitle>
          <DialogDescription>A IA analisou o log de erro para encontrar a causa raiz e sugerir uma solução.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Analisando o log de erro...</p>
          </div>
        ) : analysisResult ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
             <Alert>
              <AlertCircle className="h-4 w-4"/>
              <AlertTitle className="font-semibold">Análise da Causa Raiz</AlertTitle>
              <AlertDescription className="text-sm whitespace-pre-line">{analysisResult.analysis}</AlertDescription>
            </Alert>
             <Alert variant="default" className="bg-green-50 dark:bg-green-900/20 border-green-500/50">
               <CheckCircle className="h-4 w-4 text-green-600"/>
              <AlertTitle className="font-semibold text-green-700 dark:text-green-300">Recomendação de Correção</AlertTitle>
              <AlertDescription className="text-sm whitespace-pre-line text-green-800 dark:text-green-200">{analysisResult.recommendation}</AlertDescription>
            </Alert>
          </div>
        ) : null}
         <DialogFooter className="flex-col sm:flex-row sm:justify-between w-full">
            <Button
              type="button"
              variant="default"
              onClick={handleCopyToClipboard}
              disabled={isLoading || !analysisResult || hasCopiedForAI}
            >
              {hasCopiedForAI ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {hasCopiedForAI ? 'Copiado!' : 'Copiar para o Prototyper'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// Extracted component to handle its own state, avoiding hook calls in a loop.
function ToastComponent({ id, title, description, action, variant, ...props }: any) {
  const [hasCopied, setHasCopied] = React.useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = React.useState(false);

  const fullErrorText = React.useMemo(() => {
    const titleText = getTextContent(title);
    const descriptionText = getTextContent(description);
    return `${titleText ? titleText + "\n" : ""}${descriptionText || ""}`.trim();
  }, [title, description]);


  const handleCopy = () => {
    if (fullErrorText) {
      try {
        navigator.clipboard.writeText(fullErrorText);
      } catch (err) {
        console.error("Failed to copy text to clipboard:", err);
        // Opcional: Mostrar uma mensagem para o usuário que a cópia falhou
        // Por exemplo, usando um toast diferente ou um alerta.
        // toast({
        //   title: "Falha ao copiar",
        //   description: "Por favor, copie o texto manualmente.",
        //   variant: "destructive",
        // });
      }
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000); // Reset icon after 2 seconds
    }
  };

  return (
    <>
      <Toast key={id} variant={variant} {...props} className="flex-col items-start gap-2">
        <div className="w-full flex justify-between items-start gap-2">
            <div className="grid gap-1 flex-grow">
              {title && <ToastTitle>{title}</ToastTitle>}
            </div>
            <div className="flex flex-col gap-2 self-start flex-shrink-0">
              {variant === 'destructive' && (
                 <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive-foreground/80 hover:bg-destructive-foreground/10 hover:text-destructive-foreground"
                    onClick={() => setIsAnalysisModalOpen(true)}
                    aria-label="Analisar com IA"
                  >
                   <BrainCircuit className="h-4 w-4" />
                </Button>
              )}
              <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:bg-secondary"
                  onClick={handleCopy}
                  aria-label="Copiar notificação"
                >
                  {hasCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
              </Button>
            </div>
            <ToastClose />
        </div>

        {description && (
            <ScrollArea className="w-full max-h-[200px] pr-4">
                <ToastDescription className="text-xs whitespace-pre-wrap">{description}</ToastDescription>
            </ScrollArea>
        )}
      </Toast>
      {variant === 'destructive' && (
         <AIAnalysisModal 
            errorLog={fullErrorText}
            isOpen={isAnalysisModalOpen}
            onOpenChange={setIsAnalysisModalOpen}
          />
      )}
    </>
  );
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(toastProps => (
        <ToastComponent key={toastProps.id} {...toastProps} />
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
