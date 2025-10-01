// src/components/subscription-form.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { subscribeToAction } from '@/app/subscribe/actions';
import { Mail, Loader2, Send } from 'lucide-react';

export default function SubscriptionForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
      setEmail('');
      setName('');
    } else {
      toast({ title: 'Erro na Inscrição', description: result.message, variant: 'destructive' });
    }
    setIsLoading(false);
  };

  return (
    <section className="bg-muted/40 py-12" data-ai-id="embedded-subscription-section">
      <div className="container mx-auto max-w-4xl text-center">
        <Mail className="mx-auto h-10 w-10 text-primary mb-3" />
        <h2 className="text-2xl md:text-3xl font-bold font-headline">Fique por Dentro das Novidades</h2>
        <p className="text-muted-foreground mt-2 mb-6 max-w-2xl mx-auto">
          Inscreva-se para receber alertas exclusivos sobre os próximos leilões, lotes em destaque e oportunidades imperdíveis diretamente no seu e-mail.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-lg mx-auto">
          <Input
            type="text"
            placeholder="Seu nome (opcional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className="h-11 bg-background"
          />
           <Input
            type="email"
            placeholder="seu.email@exemplo.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="h-11 bg-background"
          />
          <Button type="submit" className="w-full sm:w-auto h-11" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {isLoading ? 'Enviando...' : 'Inscrever'}
          </Button>
        </form>
      </div>
    </section>
  );
}
