// src/app/auth/login/page.tsx
/**
 * @fileoverview Página de Login de Usuários com suporte a Multi-Tenant via Subdomínio.
 * 
 * Este componente de cliente renderiza o formulário de login e gerencia a lógica de
 * submissão. Ele interage com a `login` server action para autenticar o usuário.
 * 
 * FUNCIONALIDADE MULTI-TENANT:
 * - Se acessado via subdomínio (ex: demo.localhost:3000), o tenant é pré-selecionado
 *   e o seletor de workspace fica bloqueado.
 * - O sistema valida que o usuário pertence ao tenant do subdomínio atual.
 * - Se o usuário não pertence ao tenant, exibe mensagem de erro específica.
 */
'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { login, getDevUsers, getCurrentTenantContext } from '@/app/auth/actions';
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
    subdomain?: string | null;
};

const normalizeSelectValue = (value?: string | null) => value ?? '';

const normalizeRedirectTarget = (value?: string | null) => {
    if (!value) {
        return '/dashboard/overview';
    }

    if (!value.startsWith('/') || value.startsWith('//')) {
        return '/dashboard/overview';
    }

    return value;
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
    const [lockedTenantId, setLockedTenantId] = useState<string | null>(null);
    const [lockedTenantName, setLockedTenantName] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            email: '',
            password: '',
            tenantId: '',
        },
    });

    // Fast client-side tenant detection
    useEffect(() => {
        const hostname = window.location.hostname;
        let currentSubdomain: string | null = null;

        // Extract subdomain
        if (hostname.includes('.localhost')) {
            currentSubdomain = hostname.split('.localhost')[0];
        } else if (!hostname.includes('vercel.app') && hostname.split('.').length > 2) {
            currentSubdomain = hostname.split('.')[0];
            if (currentSubdomain === 'www') currentSubdomain = null;
        }

        // Check path-based routing (/app/[slug] or /_tenants/[slug])
        const pathname = window.location.pathname;
        const pathMatch = pathname.match(/^\/(?:app|_tenants)\/([a-z0-9-]+)/i);
        if (pathMatch) {
            currentSubdomain = pathMatch[1].toLowerCase();
        }

        // Fallback: use NEXT_PUBLIC_DEFAULT_TENANT when no subdomain is detected.
        // This env var is set per-environment in Vercel (hml, demo, production) for
        // convenience pre-selection only — it does NOT lock the selector, because the
        // user arrived via a plain URL (no actual tenant subdomain). They can change it.
        let defaultTenantPreselect: string | null = null;
        if (!currentSubdomain && process.env.NEXT_PUBLIC_DEFAULT_TENANT) {
            defaultTenantPreselect = process.env.NEXT_PUBLIC_DEFAULT_TENANT;
        }

        if (currentSubdomain && availableTenants.length > 0) {
            const matchedTenant = availableTenants.find(t => 
                t.subdomain === currentSubdomain || t.slug === currentSubdomain
            );
            
            if (matchedTenant) {
                setLockedTenantId(matchedTenant.id);
                setLockedTenantName(matchedTenant.name);
                setSelectedTenantId(matchedTenant.id);
                form.setValue('tenantId', matchedTenant.id);
                return; // Found and set, no need to wait for server action
            }
        }

        // Pre-select (but do NOT lock) when NEXT_PUBLIC_DEFAULT_TENANT fallback is active
        if (defaultTenantPreselect && availableTenants.length > 0) {
            const matchedTenant = availableTenants.find(t =>
                t.subdomain === defaultTenantPreselect || t.slug === defaultTenantPreselect
            );
            if (matchedTenant) {
                setSelectedTenantId(matchedTenant.id);
                form.setValue('tenantId', matchedTenant.id);
                return; // Pre-selected without locking
            }
        }

        // Fallback to server action if client-side detection fails
        getCurrentTenantContext().then(context => {
            // '1' is the LANDLORD_ID — not a real user tenant
            if (context.shouldLock && context.tenantId && context.tenantId !== '1') {
                // Real subdomain or path-based routing — lock the selector
                setLockedTenantId(context.tenantId);
                setLockedTenantName(context.tenantName);
                setSelectedTenantId(context.tenantId);
                form.setValue('tenantId', context.tenantId);
            } else if (context.tenantId && context.tenantId !== '1') {
                // Default tenant from env var — pre-select but keep selector editable
                setSelectedTenantId(context.tenantId);
                form.setValue('tenantId', context.tenantId);
            }
        });
    }, [availableTenants, form]);

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
        // Don't auto-select if we have a locked tenant
        if (lockedTenantId) return;
        
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
    }, [tenantOptions, form, selectedTenantId, lockedTenantId]);

    const handleLogin = async (values: LoginFormValues) => {
        setIsLoading(true);
        setError(null);

        // Usa o tenantId dos values (passado diretamente) OU do estado
        let effectiveTenantId = values.tenantId || lockedTenantId || selectedTenantId;

        // Fallback: se nenhum tenant detectado no cliente, tenta resolver via servidor.
        // Cobre o caso de domínios Vercel (*.vercel.app) onde o middleware define
        // x-tenant-id no header mas a detecção cliente pode não ter completado.
        if (!effectiveTenantId) {
            try {
                const ctx = await getCurrentTenantContext();
                // '1' is the LANDLORD_ID — skip it as it's not a real user tenant
                if (ctx.tenantId && ctx.tenantId !== '1') {
                    effectiveTenantId = ctx.tenantId;
                    // Only lock if the tenant came from a real subdomain or path-based routing
                    if (ctx.shouldLock) {
                        setLockedTenantId(ctx.tenantId);
                        setLockedTenantName(ctx.tenantName || null);
                    }
                    setSelectedTenantId(ctx.tenantId);
                    form.setValue('tenantId', ctx.tenantId);
                }
            } catch {
                // Falha silenciosa — a validação abaixo cuidará do erro
            }
        }

        if (!effectiveTenantId) {
            const validationMessage = 'Selecione um espaço de trabalho antes de continuar.';
            setError(validationMessage);
            toast({ title: 'Selecione o Espaço de Trabalho', description: validationMessage, variant: 'destructive' });
            setIsLoading(false);
            return;
        }

        // Garante que o tenantId está nos values
        values.tenantId = effectiveTenantId;

        try {
            const result = await login(values);

            if (result.success && result.user && result.user.tenants && result.user.tenants.length > 1 && !effectiveTenantId) {
                toast({ title: "Múltiplos Espaços de Trabalho", description: "Selecione em qual deles você deseja entrar." });
                setUserWithMultipleTenants(result.user);
                form.setValue('password', '[already_validated]');
            } else if (result.success && result.user) {
                const redirectUrl = normalizeRedirectTarget(
                    searchParams.get('redirect') || searchParams.get('callbackUrl')
                );
                const finalTenantId = effectiveTenantId || (result.user.tenants && result.user.tenants.length > 0 ? result.user.tenants[0].id : '1');

                loginUser(result.user, finalTenantId);

                toast({
                    title: "Login bem-sucedido!",
                    description: "Redirecionando para o seu painel...",
                });

                setTimeout(() => {
                    window.location.href = redirectUrl;
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
        <div data-ai-id="auth-login-page-container" className="wrapper-auth-page">
            <Card data-ai-id="auth-login-card" className="card-auth">
                <CardHeader className="header-auth">
                    <LogIn className="icon-auth-header" />
                    <CardTitle className="title-auth">Bem-vindo de Volta!</CardTitle>
                    <CardDescription className="desc-auth">Insira suas credenciais para acessar sua conta.</CardDescription>
                </CardHeader>

                {/* DEV ONLY: User Selector */}
                <DevUserSelector onSelect={(u) => {
                    form.setValue('email', u.email);
                    form.setValue('password', u.password);

                    // Prioridade: lockedTenantId (do subdomínio) > selectedTenantId > primeiro da lista
                    const tenantId = lockedTenantId || selectedTenantId || (availableTenants.length > 0 ? availableTenants[0].id : undefined);
                    if (tenantId) {
                        // Atualiza o estado se não estava setado
                        if (!selectedTenantId) {
                            setSelectedTenantId(tenantId);
                        }
                        form.setValue('tenantId', tenantId);
                        toast({ title: "Auto-login", description: `Autenticando como ${u.roleName}...` });
                        handleLogin({
                            email: u.email,
                            password: u.password,
                            tenantId: tenantId
                        });
                    } else {
                        toast({ title: "Atenção", description: "Selecione um tenant para continuar.", variant: "secondary" });
                    }
                }} />

                <Form {...form}>
                    <form data-ai-id="auth-login-form" onSubmit={form.handleSubmit(handleLogin)} className="form-auth">
                        <CardContent className="content-auth">
                            <FormField
                                control={form.control}
                                name="tenantId"
                                render={() => (
                                    <FormItem className="wrapper-form-item">
                                        <Label htmlFor="tenant-select" className="label-auth-tenant">
                                            <span className="wrapper-tenant-label-content">
                                                Espaço de Trabalho
                                                {lockedTenantId && <Lock className="icon-auth-locked" />}
                                            </span>
                                            {isFetchingTenants && <span className="text-auth-loading">Carregando...</span>}
                                        </Label>
                                        <FormControl>
                                            <Select
                                                value={normalizeSelectValue(selectedTenantId)}
                                                onValueChange={(value) => {
                                                    setSelectedTenantId(value);
                                                    form.setValue('tenantId', value);
                                                }}
                                                disabled={isLoading || isFetchingTenants || tenantOptions.length === 0 || !!lockedTenantId}
                                            >
                                                <SelectTrigger id="tenant-select" data-testid="tenant-select" data-ai-id="auth-login-tenant-select" className="select-auth-tenant">
                                                    <SelectValue placeholder={isFetchingTenants ? 'Carregando espaços...' : 'Selecione um tenant'} />
                                                </SelectTrigger>
                                                <SelectContent className="select-content-auth">
                                                    {tenantOptions.map((tenant) => (
                                                        <SelectItem
                                                            key={tenant.id}
                                                            value={tenant.id}
                                                            data-testid={`tenant-option-${tenant.slug || tenant.id}`}
                                                            className="item-auth-tenant"
                                                        >
                                                            {tenant.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        {lockedTenantId ? (
                                            <p className="text-auth-locked-info">
                                                Você está acessando: <strong>{lockedTenantName || 'Este espaço exclusivo'}</strong>
                                            </p>
                                        ) : userWithMultipleTenants ? (
                                            <p className="text-auth-helper">Escolha em qual espaço de trabalho deseja entrar.</p>
                                        ) : (
                                            <p className="text-auth-helper">Selecione o tenant com o qual deseja autenticar.</p>
                                        )}
                                        {tenantsError && <p className="text-auth-error">{tenantsError}</p>}
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
                                            <FormItem className="wrapper-form-item">
                                                <Label htmlFor="email" className="label-auth-field">Email</Label>
                                                <FormControl>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        placeholder="seu@email.com"
                                                        required
                                                        disabled={isLoading}
                                                        {...field}
                                                        data-ai-id="auth-login-email-input"
                                                        className="input-auth-field"
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
                                            <FormItem className="wrapper-form-item">
                                                <Label htmlFor="password" className="label-auth-field">Senha</Label>
                                                <FormControl>
                                                    <div className="wrapper-auth-password">
                                                        <Input
                                                            id="password"
                                                            type={showPassword ? "text" : "password"}
                                                            required
                                                            disabled={isLoading}
                                                            {...field}
                                                            data-ai-id="auth-login-password-input"
                                                            className="input-auth-password"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="btn-toggle-password"
                                                            data-ai-id="auth-login-toggle-password"
                                                            tabIndex={-1}
                                                        >
                                                            {showPassword ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}

                            {error && <p className="text-auth-error-center">{error}</p>}
                        </CardContent>
                        <CardFooter className="footer-auth">
                            <Button type="submit" className="btn-auth-submit" disabled={isLoading || isFetchingTenants} data-ai-id="auth-login-submit-button">
                                {isLoading ? <Loader2 className="icon-btn-spinner" /> : userWithMultipleTenants ? 'Entrar no Espaço de Trabalho' : 'Login'}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
                <div className="wrapper-auth-links">
                    <Link href="/auth/forgot-password" className="link-auth-forgot-password" data-ai-id="auth-login-forgot-link">
                        Esqueceu a senha?
                    </Link>
                    <p className="text-auth-no-account">
                        Não tem uma conta?{' '}
                        <Link href="/auth/register" className="link-auth-register" data-ai-id="auth-login-register-link">
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
    const [selectedEmail, setSelectedEmail] = useState('');

    useEffect(() => {
        getDevUsers().then(setUsers);
    }, []);

    if (users.length === 0) return null;

    return (
        <div className="px-6 pb-4">
            <Label className="text-xs text-muted-foreground mb-1 block">Dev: Auto-login (Ambiente de Teste)</Label>
            <Select value={selectedEmail} onValueChange={(email) => {
                setSelectedEmail(email);
                const u = users.find(user => user.email === email);
                if (u) onSelect({ ...u, password: u.passwordHint });
            }}>
                <SelectTrigger className="h-8 text-xs bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 border-dashed">
                    <SelectValue placeholder="Selecione para auto-login..." />
                </SelectTrigger>
                <SelectContent>
                    {users.map(u => (
                        <SelectItem key={u.email} value={u.email} className="text-xs">
                            <span className="font-medium">{u.roleName}</span>: {u.email} (Senha: {u.passwordHint})
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
