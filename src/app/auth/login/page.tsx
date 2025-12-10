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
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { login, getDevUsers } from '@/app/auth/actions';
import { useAuth } from '@/contexts/auth-context';
import type { UserProfileWithPermissions } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';


const loginFormSchema = z.object({
    email: z.string().email({ message: 'Por favor, insira um email válido.' }),
    password: z.string().min(1, { message: 'A senha é obrigatória.' }),
    tenantId: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;
type TenantOption = {
    id: string;
    name: string;
    slug?: string | null;
};


function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { loginUser } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userWithMultipleTenants, setUserWithMultipleTenants] = useState<UserProfileWithPermissions | null>(null);
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
    const [availableTenants, setAvailableTenants] = useState<TenantOption[]>([]);
    const [isFetchingTenants, setIsFetchingTenants] = useState<boolean>(true);
    const [tenantsError, setTenantsError] = useState<string | null>(null);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const fetchTenants = useCallback(async () => {
        try {
            setIsFetchingTenants(true);
            setTenantsError(null);
            const response = await fetch('/api/public/tenants', { cache: 'no-store' });
            if (!response.ok) {
                throw new Error('Não foi possível carregar os espaços de trabalho.');
            }
            const data = await response.json();
            setAvailableTenants(data.tenants || []);
        } catch (fetchError: unknown) {
            const message = fetchError instanceof Error ? fetchError.message : 'Falha ao carregar os espaços de trabalho.';
            setTenantsError(message);
        } finally {
            setIsFetchingTenants(false);
        }
    }, []);

    useEffect(() => {
        fetchTenants();
    }, [fetchTenants]);

    const tenantOptions = userWithMultipleTenants?.tenants || availableTenants;

    useEffect(() => {
        if (tenantOptions.length === 0) {
            return;
        }

        const currentTenantId = selectedTenantId;
        const tenantExists = currentTenantId && tenantOptions.some((tenant) => tenant.id === currentTenantId);

        if (!tenantExists) {
            const defaultTenantId = tenantOptions[0].id;
            setSelectedTenantId(defaultTenantId);
            form.setValue('tenantId', defaultTenantId);
        }
    }, [tenantOptions, form, selectedTenantId]);

    const handleLogin = async (values: LoginFormValues) => {
        setIsLoading(true);
        setError(null);

        if (!selectedTenantId) {
            const validationMessage = 'Selecione um espaço de trabalho antes de continuar.';
            setError(validationMessage);
            toast({ title: 'Selecione o Espaço de Trabalho', description: validationMessage, variant: 'destructive' });
            setIsLoading(false);
            return;
        }

        values.tenantId = selectedTenantId;

        try {
            const result = await login(values);

            if (result.success && result.user && result.user.tenants && result.user.tenants.length > 1 && !selectedTenantId) {
                toast({ title: "Múltiplos Espaços de Trabalho", description: "Selecione em qual deles você deseja entrar." });
                setUserWithMultipleTenants(result.user);
                form.setValue('password', '[already_validated]'); // Placeholder para não reenviar senha
            } else if (result.success && result.user) {
                const redirectUrl = searchParams.get('redirect') || '/dashboard/overview';

                const finalTenantId = selectedTenantId || (result.user.tenants && result.user.tenants.length > 0 ? result.user.tenants[0].id : '1');

                loginUser(result.user, finalTenantId);

                toast({
                    title: "Login bem-sucedido!",
                    description: "Redirecionando para o seu painel...",
                });

                setTimeout(() => {
                    router.push(redirectUrl);
                }, 300);

            } else {
                setError(result.message);
                toast({ title: "Erro no Login", description: result.message, variant: "destructive" });
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
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

                {/* DEV ONLY: User Selector */}
                <DevUserSelector onSelect={(u) => {
                    form.setValue('email', u.email);
                    form.setValue('password', u.passwordHint);
                }} />

                <Form {...form}>
                    <form data-ai-id="auth-login-form" onSubmit={form.handleSubmit(handleLogin)}>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="tenantId"
                                render={() => (
                                    <FormItem>
                                        <Label htmlFor="tenant-select" className="flex items-center justify-between text-sm font-medium">
                                            Espaço de Trabalho
                                            {isFetchingTenants && <span className="text-xs text-muted-foreground">Carregando...</span>}
                                        </Label>
                                        <FormControl>
                                            <Select
                                                value={selectedTenantId || undefined}
                                                onValueChange={(value) => {
                                                    setSelectedTenantId(value);
                                                    form.setValue('tenantId', value);
                                                }}
                                                disabled={isLoading || isFetchingTenants || tenantOptions.length === 0}
                                            >
                                                <SelectTrigger id="tenant-select" data-testid="tenant-select" data-ai-id="auth-login-tenant-select">
                                                    <SelectValue placeholder={isFetchingTenants ? 'Carregando espaços...' : 'Selecione um tenant'} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {tenantOptions.map((tenant) => (
                                                        <SelectItem
                                                            key={tenant.id}
                                                            value={tenant.id}
                                                            data-testid={`tenant-option-${tenant.slug || tenant.id}`}
                                                        >
                                                            {tenant.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        {userWithMultipleTenants ? (
                                            <p className="text-xs text-muted-foreground">Escolha em qual espaço de trabalho deseja entrar.</p>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">Selecione o tenant com o qual deseja autenticar.</p>
                                        )}
                                        {tenantsError && <p className="text-xs text-destructive">{tenantsError}</p>}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {!userWithMultipleTenants && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Label htmlFor="email">Email</Label>
                                                <FormControl>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        placeholder="seu@email.com"
                                                        required
                                                        disabled={isLoading}
                                                        {...field}
                                                        data-ai-id="auth-login-email-input"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Label htmlFor="password">Senha</Label>
                                                <FormControl>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        required
                                                        disabled={isLoading}
                                                        {...field}
                                                        data-ai-id="auth-login-password-input"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}

                            {error && <p className="text-sm text-destructive text-center">{error}</p>}
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button type="submit" className="w-full" disabled={isLoading} data-ai-id="auth-login-submit-button">
                                {isLoading ? <Loader2 className="animate-spin" /> : userWithMultipleTenants ? 'Entrar no Espaço de Trabalho' : 'Login'}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
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

function DevUserSelector({ onSelect }: { onSelect: (u: any) => void }) {
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        // Check if we are in development mode (client-side check usually relies on env vars exposed to client or just try calling the action)
        // Since getDevUsers checks NODE_ENV on server, it will return empty array if not dev.
        getDevUsers().then(setUsers);
    }, []);

    if (users.length === 0) return null;

    return (
        <div className="px-6 pb-4">
            <Label className="text-xs text-muted-foreground mb-1 block">Dev: Auto-login (Ambiente de Teste)</Label>
            <Select onValueChange={(email) => {
                const u = users.find(user => user.email === email);
                if (u) onSelect(u);
            }}>
                <SelectTrigger className="h-8 text-xs bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 border-dashed">
                    <SelectValue placeholder="Selecione um usuário de teste..." />
                </SelectTrigger>
                <SelectContent>
                    {users.map(u => (
                        <SelectItem key={u.email} value={u.email} className="text-xs">
                            <span className="font-medium">{u.roleName}</span>: {u.email}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function LoginPageFallback() {
    return (
        <div data-ai-id="auth-login-page-loading" className="flex items-center justify-center min-h-[calc(100vh-20rem)] py-12">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center">
                    <LogIn className="mx-auto h-12 w-12 text-primary mb-2" />
                    <CardTitle className="text-2xl font-bold font-headline">Carregando...</CardTitle>
                    <CardDescription>Preparando a página de login.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginPageFallback />}>
            <LoginPageContent />
        </Suspense>
    );
}
