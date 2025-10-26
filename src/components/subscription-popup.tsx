// src/components/subscription-popup.tsx
'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { subscribeToAction } from '@/app/subscribe/actions';
import Image from 'next/image';

const SUBSCRIPTION_POPUP_KEY = 'bidexpert-subscription-popup-seen';
const POPUP_DELAY_MS = 5000; // 5 segundos

export default function SubscriptionPopup() {
  const [hasSeenPopup, setHasSeenPopup] = useLocalStorage(SUBSCRIPTION_POPUP_KEY, false);
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, POPUP_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [hasSeenPopup]);

  const handleClose = () => {
    setIsOpen(false);
    setHasSeenPopup(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Email obrigatório', description: 'Por favor, insira seu e-mail.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    
    const result = await subscribeToAction({ email, name });

    if (result.success) {
      toast({ title: 'Inscrição realizada!', description: result.message });
      handleClose();
    } else {
      if (result.message.includes('Este e-mail já está inscrito.')) {
        toast({
          title: 'Você já está inscrito!',
          description: 'Que bom ter você conosco! Você já está na nossa lista de notificações.',
        });
        handleClose();
      } else {
        toast({ title: 'Erro na Inscrição', description: result.message, variant: 'destructive' });
      }
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden" data-ai-id="subscription-modal">
        <div className="relative h-40 w-full">
            <Image 
                src="https://images.unsplash.com/photo-1563986768609-322da13575f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxNEWSLETTERfGVufDB8fHx8MTcxMTcxOTg3Mnww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Imagem de newsletter"
                fill
                sizes="100vw"
                className="object-cover"
                data-ai-hint="newsletter e-mail"
            />
             <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="p-6">
            <DialogHeader className="text-center">
            <Mail className="mx-auto h-8 w-8 text-primary mb-2" />
            <DialogTitle className="text-xl font-bold">Não Perca Nenhuma Oportunidade!</DialogTitle>
            <DialogDescription>
                Inscreva-se para receber alertas sobre novos leilões, lotes em destaque e promoções exclusivas.
            </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="space-y-1">
                <Label htmlFor="name-popup" className="sr-only">Nome</Label>
                <Input
                  id="name-popup"
                  placeholder="Seu nome (opcional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  data-ai-id="subscription-name-input"
                />
              </div>
               <div className="space-y-1">
                <Label htmlFor="email-popup" className="sr-only">Email</Label>
                <Input
                  id="email-popup"
                  type="email"
                  placeholder="Seu melhor e-mail"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  data-ai-id="subscription-email-input"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading} data-ai-id="subscription-submit-button">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Inscrevendo...' : 'Inscrever-se Gratuitamente'}
              </Button>
            </form>
            <Button variant="link" size="sm" className="w-full text-xs text-muted-foreground mt-2" onClick={handleClose} data-ai-id="subscription-close-button">
                Não, obrigado.
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
