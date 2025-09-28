// src/app/auth/reset-password/[token]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { resetPassword, verifyPasswordResetToken } from '../../actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, KeyRound, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setError("Token de redefinição não fornecido.");
        setIsLoading(false);
        return;
      }
      const result = await verifyPasswordResetToken(token);
      if (result.success) {
        setIsValidToken(true);
      } else {
        setError(result.message);
      }
      setIsLoading(false);
    };
    checkToken();
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== passwordConfirmation) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        return;
    }
    
    setIsLoading(true);
    setError(null);

    const result = await resetPassword(token, password);

    if (result.success) {
      toast({
        title: "Senha Redefinida!",
        description: "Sua senha foi alterada com sucesso. Você já pode fazer login.",
      });
      router.push('/auth/login');
    } else {
      setError(result.message);
      toast({ title: "Erro ao Redefinir", description: result.message, variant: "destructive" });
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Verificando...</p>
      </div>
    );
  }
  
  if (!isValidToken) {
      return (
          <div className="flex items-center justify-center min-h-[calc(100vh-20rem)] py-12">
            <Card className="w-full max-w-md shadow-xl text-center">
                <CardHeader>
                    <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-2" />
                    <CardTitle className="text-2xl font-bold font-headline">Link Inválido ou Expirado</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{error || 'O link para redefinição de senha não é mais válido.'}</p>
                </CardContent>
                 <CardFooter>
                    <Button asChild className="w-full"><Link href="/auth/forgot-password">Solicitar Novo Link</Link></Button>
                </CardFooter>
            </Card>
          </div>
      )
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-20rem)] py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <KeyRound className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-2xl font-bold font-headline">Crie uma Nova Senha</CardTitle>
          <CardDescription>
            Digite e confirme sua nova senha de acesso.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="passwordConfirmation">Confirme a Nova Senha</Label>
              <Input
                id="passwordConfirmation"
                name="passwordConfirmation"
                type="password"
                required
                disabled={isLoading}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Salvando...' : 'Salvar Nova Senha'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
