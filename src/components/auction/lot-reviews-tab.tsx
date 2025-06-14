'use client';

import { useState } from 'react';
import type { Lot, Review } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageCircle, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/auth-context';

interface LotReviewsTabProps {
  lot: Lot;
  reviews: Review[];
  isLoading: boolean;
  onNewReview: (rating: number, comment: string) => Promise<boolean>;
  canUserReview: boolean;
}

export default function LotReviewsTab({ lot, reviews, isLoading, onNewReview, canUserReview }: LotReviewsTabProps) {
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newReviewRating === 0 || newReviewText.trim() === '') {
      alert("Por favor, selecione uma avaliação e escreva um comentário.");
      return;
    }
    setIsSubmittingReview(true);
    const success = await onNewReview(newReviewRating, newReviewText);
    if (success) {
      setNewReviewText('');
      setNewReviewRating(0);
      setHoverRating(0); // Reset hover state as well
    }
    setIsSubmittingReview(false);
  };

  return (
    <Card className="shadow-none border-0">
      <CardHeader className="px-1 pt-0">
        <CardTitle className="text-xl font-semibold flex items-center">
          <MessageCircle className="h-5 w-5 mr-2 text-muted-foreground" /> Avaliações do Lote ({reviews.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-1 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Carregando avaliações...</p>
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {reviews.map(review => (
              <div key={review.id} className="p-3 border rounded-md bg-secondary/30">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-foreground">{review.userDisplayName || 'Anônimo'}</p>
                  <div className="flex items-center">
                    {[1,2,3,4,5].map(star => (
                        <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/50'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1.5">{review.createdAt ? format(new Date(review.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data indisponível'}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma avaliação para este lote ainda.</p>
        )}

        {canUserReview ? (
          <form onSubmit={handleSubmitReview} className="space-y-3 pt-4 border-t">
            <h4 className="text-md font-semibold">Deixe sua avaliação:</h4>
            <div className="flex items-center space-x-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 cursor-pointer transition-colors
                    ${(hoverRating || newReviewRating) >= star ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30 hover:text-amber-300'}
                  `}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setNewReviewRating(star)}
                  aria-label={`Avaliar com ${star} estrelas`}
                />
              ))}
            </div>
            <Textarea
              placeholder="Escreva seu comentário sobre o lote..."
              value={newReviewText}
              onChange={(e) => setNewReviewText(e.target.value)}
              rows={3}
              disabled={isSubmittingReview}
            />
            <Button type="submit" disabled={isSubmittingReview || newReviewRating === 0 || newReviewText.trim() === ''}>
              {isSubmittingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Enviar Avaliação
            </Button>
          </form>
        ) : (
            <p className="text-xs text-muted-foreground pt-4 border-t">
                Você precisa estar logado para enviar uma avaliação.
            </p>
        )}
      </CardContent>
    </Card>
  );
}
