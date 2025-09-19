// src/app/auth/login/page.tsx
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
    const redirectUrl = searchParams.get('redirect') || '/dashboard/overview';
    formData.append('redirectUrl', redirectUrl);

    if (selectedTenantId) {
        formData.set('tenantId', selectedTenantId);
    }
    
    try {
        const result = await login(formData);
        // If login returns, it's because there was an error or a multi-tenant selection is needed.
        if (result && !result.success) {
            setError(result.message);
            toast({ title: "Erro no Login", description: result.message, variant: "destructive" });
        } else if (result && result.user && result.user.tenants && result.user.tenants.length > 1) {
            toast({ title: "Múltiplos Espaços de Trabalho", description: "Selecione em qual deles você deseja entrar." });
            setUserWithMultipleTenants(result.user);
        }
    } catch (e: any) {
        // Catch errors that might not be returned as a JSON object, like network errors.
        const errorMessage = e.message || 'Ocorreu um erro inesperado.';
        setError(errorMessage);
        toast({ title: "Erro no Login", description: errorMessage, variant: "destructive" });
    } finally {
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
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Senha</Label>
                        <Link href="#" className="text-sm text-primary hover:underline">Esqueceu a senha?</Link>
                    </div>
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
