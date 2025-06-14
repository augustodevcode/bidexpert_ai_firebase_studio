'use client';

import { useState } from 'react';
import type { Lot, LotQuestion } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HelpCircle, Send, Loader2, CornerDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/auth-context';

interface LotQuestionsTabProps {
  lot: Lot;
  questions: LotQuestion[];
  isLoading: boolean;
  onNewQuestion: (questionText: string) => Promise<boolean>;
  canUserAskQuestion: boolean;
}

export default function LotQuestionsTab({ lot, questions, isLoading, onNewQuestion, canUserAskQuestion }: LotQuestionsTabProps) {
  const [newQuestionText, setNewQuestionText] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuestionText.trim() === '') {
      alert("Por favor, escreva sua pergunta.");
      return;
    }
    setIsSubmittingQuestion(true);
    const success = await onNewQuestion(newQuestionText);
    if (success) {
      setNewQuestionText('');
    }
    setIsSubmittingQuestion(false);
  };

  return (
    <Card className="shadow-none border-0">
      <CardHeader className="px-1 pt-0">
        <CardTitle className="text-xl font-semibold flex items-center">
          <HelpCircle className="h-5 w-5 mr-2 text-muted-foreground" /> Perguntas e Respostas ({questions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-1 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Carregando perguntas...</p>
          </div>
        ) : questions.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {questions.map(qa => (
              <div key={qa.id} className="p-3 border rounded-md bg-secondary/30">
                <div className="mb-1.5">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{qa.userDisplayName || 'Usuário'}</span> perguntou em {qa.createdAt ? format(new Date(qa.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data indisponível'}:
                  </p>
                  <p className="text-sm text-foreground mt-0.5 whitespace-pre-line">{qa.questionText}</p>
                </div>
                {qa.answerText && (
                  <div className="mt-2 pt-2 border-t border-border/50 pl-4">
                     <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-primary">Resposta de {qa.answeredByUserDisplayName || 'Vendedor'}</span> (em {qa.answeredAt ? format(new Date(qa.answeredAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ''}):
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-line">{qa.answerText}</p>
                  </div>
                )}
                {/* Placeholder for answer form if user is seller/admin */}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma pergunta feita para este lote ainda.</p>
        )}

        {canUserAskQuestion ? (
          <form onSubmit={handleSubmitQuestion} className="space-y-3 pt-4 border-t">
            <h4 className="text-md font-semibold">Faça sua pergunta:</h4>
            <Textarea
              placeholder="Escreva sua dúvida sobre o lote..."
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              rows={3}
              disabled={isSubmittingQuestion}
            />
            <Button type="submit" disabled={isSubmittingQuestion || newQuestionText.trim() === ''}>
              {isSubmittingQuestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Enviar Pergunta
            </Button>
          </form>
        ) : (
             <p className="text-xs text-muted-foreground pt-4 border-t">
                Você precisa estar logado e habilitado para fazer perguntas.
            </p>
        )}
      </CardContent>
    </Card>
  );
}
