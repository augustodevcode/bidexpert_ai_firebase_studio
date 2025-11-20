'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getImpersonatableLawyersAction } from './actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LawyerOption {
  id: string;
  fullName: string;
  email: string;
  cpf: string | null;
  activeCasesCount: number;
}

interface LawyerImpersonationSelectorProps {
  currentUserId: string;
  selectedLawyerId: string | null;
  onLawyerChange: (lawyerId: string | null) => void;
  onLawyerSelected?: (lawyer: LawyerOption | null) => void;
}

export function LawyerImpersonationSelector({
  currentUserId,
  selectedLawyerId,
  onLawyerChange,
  onLawyerSelected,
}: LawyerImpersonationSelectorProps) {
  const [lawyers, setLawyers] = useState<LawyerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLawyers() {
      try {
        setIsLoading(true);
        const lawyersList = await getImpersonatableLawyersAction();
        setLawyers(lawyersList);
        setError(null);
      } catch (err) {
        console.error('[LawyerImpersonationSelector] Error loading lawyers:', err);
        setError('Não foi possível carregar a lista de advogados.');
        setLawyers([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadLawyers();
  }, []);

  if (error) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Carregando advogados...</CardTitle>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (lawyers.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5" data-testid="lawyer-impersonation-selector" data-ai-id="lawyer-impersonation-selector">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <CardTitle className="text-base">Visualização Administrativa</CardTitle>
            <CardDescription className="text-xs">
              Selecione um advogado para visualizar seu painel
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Admin
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Select
          value={selectedLawyerId ?? currentUserId}
          onValueChange={(value) => {
            if (value === currentUserId) {
              onLawyerChange(null);
              onLawyerSelected?.(null);
            } else {
              onLawyerChange(value);
              const selected = lawyers.find(l => l.id === value);
              onLawyerSelected?.(selected || null);
            }
          }}
        >
          <SelectTrigger className="w-full" data-testid="lawyer-select-trigger" data-ai-id="lawyer-select-trigger">
            <SelectValue placeholder="Selecione um advogado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={currentUserId} data-testid="lawyer-option-self" data-ai-id="lawyer-option-self">
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                <span className="font-medium">Meu próprio painel</span>
              </div>
            </SelectItem>
            {lawyers.map((lawyer) => (
              <SelectItem
                key={lawyer.id}
                value={lawyer.id}
                data-testid={`lawyer-option-${lawyer.id}`}
                data-ai-id={`lawyer-option-${lawyer.id}`}
              >
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{lawyer.fullName}</span>
                    <span className="text-xs text-muted-foreground">{lawyer.email}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {lawyer.activeCasesCount} {lawyer.activeCasesCount === 1 ? 'caso' : 'casos'}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedLawyerId && selectedLawyerId !== currentUserId && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Você está visualizando o painel como administrador
          </p>
        )}
      </CardContent>
    </Card>
  );
}
