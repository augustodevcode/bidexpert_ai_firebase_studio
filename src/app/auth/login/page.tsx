
'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { authenticateUserSql } from '../actions'; // Nova action
import { useAuth } from '@/contexts/auth-context'; // Para setar o usuário no contexto
import type { UserProfileWithPermissions } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { setUser, setUserProfileWithPermissions } = useAuth(); // Do AuthContext
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM?.toUpperCase() || 'FIRESTORE';
    const redirectUrl = searchParams.get('redirect') || '/dashboard/overview';

    if (activeSystem === 'FIRESTORE') {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: "Login bem-sucedido!",
          description: "Redirecionando...",
        });
        // O onAuthStateChanged no AuthProvider cuidará de setar user e userProfile
        router.push(redirectUrl);
      } catch (e: any) {
        setError(e.message || 'Falha ao fazer login. Verifique suas credenciais.');
        toast({
          title: "Erro no Login",
          description: e.message || 'Falha ao fazer login. Verifique suas credenciais.',
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else { // MYSQL ou POSTGRES
      try {
        const result = await authenticateUserSql(email, password);
        if (result.success && result.user) {
          toast({
            title: `Login bem-sucedido (${activeSystem})!`,
            description: "Redirecionando...",
          });
          // Salvar no localStorage para persistência
          if (typeof window !== 'undefined') {
            localStorage.setItem('userProfile', JSON.stringify(result.user));
          }
          // Setar no contexto para uso imediato
          setUser(null); // Limpar qualquer usuário Firebase, se houver
          setUserProfileWithPermissions(result.user as UserProfileWithPermissions);
          router.push(redirectUrl);
        } else {
          setError(result.message);
          toast({
            title: `Erro no Login (${activeSystem})`,
            description: result.message,
            variant: "destructive",
          });
        }
      } catch (e: any) {
        setError(e.message || `Erro ao autenticar com o banco de dados ${activeSystem}.`);
        toast({
          title: `Erro no Login (${activeSystem})`,
          description: e.message || `Erro ao autenticar com o banco de dados ${activeSystem}.`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-20rem)] py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-2xl font-bold font-headline">Bem-vindo de Volta!</CardTitle>
          <CardDescription>Insira suas credenciais para acessar sua conta.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link href="#" className="text-sm text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Login'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Não tem uma conta?{' '}
              <Link href="/auth/register" className="font-medium text-primary hover:underline">
                Registre-se
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
