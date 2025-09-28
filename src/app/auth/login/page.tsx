// src/app/auth/login/page.tsx
/**
 * @fileoverview Página de Login de Usuários.
 * Este componente de cliente renderiza o formulário de login e gerencia a lógica de
 * submissão. Ele interage com a `login` server action para autenticar o usuário.
 * Uma característica importante é o tratamento do cenário multi-tenant: se um
 * usuário pertence a múltiplos "espaços de trabalho" (tenants), a UI apresenta
 * um seletor para que o usuário escolha em qual tenant deseja logar.
 */
'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2 } from 'lucide-react';
import { useState, type FormEvent, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { login } from '@/app/auth/actions';
import { useAuth } from '@/contexts/auth-context';
import type { UserProfileWithPermissions, Tenant } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { loginUser } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userWithMultipleTenants, setUserWithMultipleTenants] = useState<UserProfileWithPermissions | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  useEffect(() => {
    if (userWithMultipleTenants?.tenants && userWithMultipleTenants.tenants.length > 0) {
      setSelectedTenantId(userWithMultipleTenants.tenants[0].id);
    }
  }, [userWithMultipleTenants]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(event.currentTarget);
    
    if (selectedTenantId) {
        formData.set('tenantId', selectedTenantId);
    }
    
    try {
        const result = await login(formData);
        
        if (result.success && result.user && result.user.tenants && result.user.tenants.length > 1 && !selectedTenantId) {
            // Caso de múltiplos tenants: exibir o seletor
            toast({ title: "Múltiplos Espaços de Trabalho", description: "Selecione em qual deles você deseja entrar." });
            setUserWithMultipleTenants(result.user);
            setIsLoading(false);
        } else if (result.success && result.user) {
            // Login bem-sucedido e tenant definido: redirecionar
            const redirectUrl = searchParams.get('redirect') || '/dashboard/overview';
            loginUser(result.user, selectedTenantId || result.user.tenants[0].id);

            // Adiciona o toast e um pequeno delay antes de redirecionar
            toast({
                title: "Login bem-sucedido!",
                description: "Redirecionando para o seu painel...",
            });

            setTimeout(() => {
                router.push(redirectUrl);
            }, 300); // 300ms de delay
            
        } else {
            // Falha no login
            setError(result.message);
            toast({ title: "Erro no Login", description: result.message, variant: "destructive" });
            setIsLoading(false);
        }
    } catch (e: any) {
        const errorMessage = e.message || 'Ocorreu um erro inesperado.';
        setError(errorMessage);
        toast({ title: "Erro no Login", description: errorMessage, variant: "destructive" });
        setIsLoading(false);
    }
  };

  return (
    <div data-ai-id="auth-login-page-container" className="flex items-center justify-center min-h-[calc(100vh-20rem)] py-12">
      <Card data-ai-id="auth-login-card" className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-2xl font-bold font-headline">Bem-vindo de Volta!</CardTitle>
          <CardDescription>Insira suas credenciais para acessar sua conta.</CardDescription>
        </CardHeader>
        <form data-ai-id="auth-login-form" onSubmit={handleLogin}>
          <CardContent className="space-y-4">
             {userWithMultipleTenants ? (
                <div className="space-y-2">
                    <Label htmlFor="tenant-select">Selecione o Espaço de Trabalho</Label>
                    <Select onValueChange={setSelectedTenantId} defaultValue={selectedTenantId || undefined}>
                        <SelectTrigger id="tenant-select">
                            <SelectValue placeholder="Escolha um tenant..." />
                        </SelectTrigger>
                        <SelectContent>
                            {userWithMultipleTenants.tenants.map((tenant) => (
                                <SelectItem key={tenant.id} value={tenant.id}>
                                    {tenant.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     {/* Hidden inputs to resubmit credentials */}
                     <input type="hidden" name="email" value={userWithMultipleTenants.email} />
                     <input type="hidden" name="password" value="[already_validated]" />
                </div>
            ) : (
                <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" placeholder="seu@email.com" required disabled={isLoading} data-ai-id="auth-login-email-input" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input id="password" name="password" type="password" required disabled={isLoading} data-ai-id="auth-login-password-input" />
                    </div>
                </>
            )}
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading} data-ai-id="auth-login-submit-button">
              {isLoading ? <Loader2 className="animate-spin" /> : (userWithMultipleTenants ? 'Entrar no Espaço de Trabalho' : 'Login')}
            </Button>
          </CardFooter>
        </form>
         <div className="text-center text-sm pb-6 px-6">
              <Link href="/auth/forgot-password" className="text-primary hover:underline">
                Esqueceu a senha?
              </Link>
              <p className="text-muted-foreground mt-4">
                Não tem uma conta?{' '}
                <Link href="/auth/register" className="font-medium text-primary hover:underline">
                  Registre-se
                </Link>
              </p>
          </div>
      </Card>
    </div>
  );
}
