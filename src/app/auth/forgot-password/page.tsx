// src/app/auth/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { requestPasswordReset } from '../actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Mail } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const result = await requestPasswordReset(email);
    
    // Mostramos a mesma mensagem de sucesso independentemente do resultado
    // para não revelar se um e-mail está ou não cadastrado no sistema.
    setIsSubmitted(true);
    toast({
      title: 'Verifique suas mensagens',
      description: result.message,
    });

    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-20rem)] py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Mail className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-2xl font-bold font-headline">Redefinir Senha</CardTitle>
          <CardDescription>
            {isSubmitted 
              ? 'Instruções enviadas!' 
              : 'Digite seu e-mail para receber as instruções de redefinição de senha.'
            }
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            {isSubmitted ? (
              <div className="text-center text-muted-foreground text-sm p-4 bg-secondary rounded-md">
                <p>
                  Se um usuário com este e-mail estiver registrado, uma mensagem com um link para redefinir sua senha foi enviada para o WhatsApp de desenvolvimento. O link expira em 1 hora.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
             {!isSubmitted && (
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Enviando...' : 'Enviar Link de Redefinição'}
                </Button>
             )}
            <Link href="/auth/login" className="text-sm text-primary hover:underline">
              Voltar para o Login
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
