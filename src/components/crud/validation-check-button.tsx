// src/components/crud/validation-check-button.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Loader2, ClipboardCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type ValidationResult } from '@/lib/form-validator';
import { cn } from '@/lib/utils';

interface ValidationCheckButtonProps {
  onCheck: () => ValidationResult;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showInline?: boolean; // Show result inline instead of dialog
}

export function ValidationCheckButton({
  onCheck,
  label = 'Validar Formulário',
  variant = 'outline',
  size = 'default',
  className,
  showInline = false,
}: ValidationCheckButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleCheck = () => {
    setIsChecking(true);
    try {
      const result = onCheck();
      setValidationResult(result);
      if (!showInline) {
        setIsDialogOpen(true);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const progress = validationResult
    ? Math.round((validationResult.fieldCount.valid / validationResult.fieldCount.total) * 100)
    : 0;

  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          type="button"
          variant={variant}
          size={size}
          onClick={handleCheck}
          disabled={isChecking}
          className="gap-2"
        >
          {isChecking && <Loader2 className="h-4 w-4 animate-spin" />}
          {!isChecking && <ClipboardCheck className="h-4 w-4" />}
          {label}
        </Button>

        {showInline && validationResult && (
          <div className="flex items-center gap-2">
            {validationResult.isValid ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Válido
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="mr-1 h-3 w-3" />
                {validationResult.errors.length} erros
              </Badge>
            )}
          </div>
        )}
      </div>

      {!showInline && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {validationResult?.isValid ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Validação Aprovada
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Validação Reprovada
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                Resultado da verificação de validação do formulário
              </DialogDescription>
            </DialogHeader>

            {validationResult && (
              <div className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Campos válidos</span>
                    <span className="font-medium">
                      {validationResult.fieldCount.valid} / {validationResult.fieldCount.total} ({progress}%)
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-3">
                    <div className="text-2xl font-bold">{validationResult.fieldCount.filled}</div>
                    <div className="text-xs text-muted-foreground">Campos Preenchidos</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-2xl font-bold text-destructive">
                      {validationResult.fieldCount.invalid}
                    </div>
                    <div className="text-xs text-muted-foreground">Campos Inválidos</div>
                  </div>
                </div>

                {/* Missing Required Fields */}
                {validationResult.missingRequired.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Campos Obrigatórios Faltando ({validationResult.missingRequired.length})</AlertTitle>
                    <AlertDescription>
                      <ScrollArea className="h-24 mt-2">
                        <ul className="list-disc list-inside space-y-1">
                          {validationResult.missingRequired.map((field) => (
                            <li key={field} className="text-sm">
                              {field}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Validation Errors */}
                {validationResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">
                      Erros de Validação ({validationResult.errors.length})
                    </h4>
                    <ScrollArea className="h-48 rounded-md border p-4">
                      <div className="space-y-3">
                        {validationResult.errors.map((error, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{error.field}</p>
                                <p className="text-sm text-muted-foreground">{error.message}</p>
                              </div>
                            </div>
                            {index < validationResult.errors.length - 1 && (
                              <div className="border-b" />
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Success Message */}
                {validationResult.isValid && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Tudo Pronto!</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Todos os campos estão válidos e o formulário está pronto para ser enviado.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
