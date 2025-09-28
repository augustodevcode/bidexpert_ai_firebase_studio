
// src/app/admin/settings/page.tsx
'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPlatformSettings, resetSampleDataAction, dropAllTablesAction, runFullSeedAction } from './actions';
import SettingsForm from './settings-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Settings as SettingsIcon, Palette, Fingerprint, Wrench, Loader2, MapPin, Search as SearchIconLucide, Clock as ClockIcon, Link2, Database, ArrowUpDown, Zap, Rows, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { PlatformSettings } from '@/types';
import { useToast } from '@/hooks/use-toast'; 
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const settingsSections = [
    { id: 'identity', label: 'Identidade do Site', icon: Fingerprint, description: 'Título, tagline, logo e favicon.' },
    { id: 'general', label: 'Configurações Gerais', icon: Wrench, description: 'Máscaras de ID, assistente de setup, etc.' },
    { id: 'storage', label: 'Armazenamento', icon: Database, description: 'Configure onde os arquivos de mídia são salvos.' },
    { id: 'appearance', label: 'Aparência e Exibição', icon: Palette, description: 'Gerencie temas, paginação e cronômetros.' },
    { id: 'listDisplay', label: 'Listas de Cadastros', icon: Rows, description: 'Opções de exibição para as tabelas do admin.' },
    { id: 'bidding', label: 'Lances e Automação', icon: Zap, description: 'Configure lances instantâneos e incrementos.'},
    { id: 'variableIncrements', label: 'Incremento de Lance', icon: ArrowUpDown, description: 'Defina incrementos variáveis para faixas de preço.' },
    { id: 'maps', label: 'Configurações de Mapa', icon: MapPin, description: 'Provedor de mapa padrão e chaves API.' },
];

function DangerZone() {
    const { toast } = useToast();
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [confirmationText, setConfirmationText] = useState('');
    
    const handleResetSetup = () => {
        if(typeof window !== 'undefined') {
            localStorage.removeItem('bidexpert_setup_complete');
            toast({ title: "Assistente Reiniciado", description: "A página será recarregada para iniciar a configuração."});
            setTimeout(() => window.location.href = '/setup', 1000);
        }
    };
    
    const handleAction = async (action: 'seed' | 'reset' | 'drop') => {
        setIsActionLoading(action);
        let result = { success: false, message: 'Ação não reconhecida.' };
        try {
            if (action === 'seed') {
                toast({ title: 'Populando Dados', description: 'Isso pode levar alguns instantes. Por favor, aguarde.'});
                result = await runFullSeedAction();
            }
            
            if (result.success) {
                toast({ title: 'Sucesso!', description: result.message });
                setTimeout(() => window.location.reload(), 1500);
            } else {
                toast({ title: 'Erro na Ação', description: result.message, variant: 'destructive' });
            }
        } catch(err: any) {
            toast({ title: 'Erro Crítico', description: err.message, variant: 'destructive' });
        } finally {
            setIsActionLoading(null);
            setConfirmationText('');
        }
    }

    return (
        <Card className="border-destructive mt-6">
            <CardHeader>
                <CardTitle className="text-md text-destructive">Zona de Perigo</CardTitle>
                <CardDescription>Ações importantes para o ambiente de desenvolvimento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Reiniciar Assistente de Configuração</AlertTitle>
                    <AlertDescription>
                        Esta ação forçará o assistente de setup a ser exibido na próxima recarga da página para reconfigurar o ambiente.
                    </AlertDescription>
                     <Button variant="outline" size="sm" className="mt-3 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleResetSetup}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Reiniciar Assistente
                    </Button>
                </Alert>
                <Alert variant="default" className="border-blue-500/50">
                    <Database className="h-4 w-4" />
                    <AlertTitle>Popular com Dados de Demonstração</AlertTitle>
                    <AlertDescription>
                        Preenche o banco de dados com um conjunto completo de dados para testes (leilões, lotes, etc.), ignorando itens que já existem.
                    </AlertDescription>
                     <AlertDialog onOpenChange={() => setConfirmationText('')}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="mt-3">
                            {isActionLoading === 'seed' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Database className="mr-2 h-4 w-4" />}
                            Popular Banco de Dados
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Popular com Dados de Demonstração?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação irá adicionar dados de exemplo ao banco de dados, como leilões, lotes e usuários. Nenhum dado existente será apagado. Para confirmar, digite <strong>popular</strong> abaixo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-seed">Confirmação</Label>
                            <Input id="confirm-seed" value={confirmationText} onChange={(e) => setConfirmationText(e.target.value)} />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isActionLoading === 'seed'}>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleAction('seed')} disabled={confirmationText !== 'popular' || isActionLoading === 'seed'}>
                            {isActionLoading === 'seed' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Confirmar e Popular
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </Alert>
            </CardContent>
        </Card>
    );
}

interface AdminSettingsPageContentProps {
    initialSettings: PlatformSettings | null;
    initialError?: string | null;
    onRetry?: () => void; 
}

function AdminSettingsPageContent({ initialSettings, initialError, onRetry }: AdminSettingsPageContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeSection, setActiveSection] = useState<string>(settingsSections[0]?.id || 'identity'); // Default to first or identity

    useEffect(() => {
        const section = searchParams.get('section');
        if (section && settingsSections.some(s => s.id === section)) {
            setActiveSection(section);
        } else if (!searchParams.get('section') && settingsSections.length > 0) {
             if (activeSection !== settingsSections[0].id) {
                 router.replace(`/admin/settings?section=${settingsSections[0].id}`, { scroll: false });
             }
        }
    }, [searchParams, router, activeSection]); 

    if (initialError) {
        return (
             <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold font-headline flex items-center text-destructive">
                    <SettingsIcon className="h-7 w-7 mr-3" />
                    Erro ao Carregar Configurações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-destructive-foreground">{initialError}</p>
                  {onRetry && <Button onClick={onRetry} className="mt-4">Tentar Novamente</Button>}
                </CardContent>
            </Card>
        );
    }
    
    if (!initialSettings) { 
        return (
             <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Carregando configurações...</p>
            </div>
        );
    }

    const currentSectionDetails = settingsSections.find(s => s.id === activeSection);

    return (
        <div className="grid md:grid-cols-[280px_1fr] gap-8 items-start">
            <nav className="sticky top-24 space-y-2 hidden md:block">
                <h3 className="text-lg font-semibold text-primary px-3">Configurações</h3>
                {settingsSections.map((section) => (
                <Button
                    key={section.id}
                    variant={activeSection === section.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    asChild
                >
                    <Link href={`/admin/settings?section=${section.id}`} scroll={false}>
                    {section.icon && <section.icon className="mr-2 h-5 w-5" />}
                    {section.label}
                    </Link>
                </Button>
                ))}
            </nav>

            <div className="md:hidden mb-6">
                <select 
                    value={activeSection} 
                    onChange={(e) => router.push(`/admin/settings?section=${e.target.value}`)}
                    className="w-full p-2 border rounded-md bg-background"
                >
                {settingsSections.map(section => (
                    <option key={section.id} value={section.id}>{section.label}</option>
                ))}
                </select>
            </div>

            <Card className="shadow-lg md:col-start-2">
                <CardHeader>
                <CardTitle className="text-2xl font-bold font-headline flex items-center">
                    {currentSectionDetails?.icon && <currentSectionDetails.icon className="h-7 w-7 mr-3 text-primary" />}
                    {currentSectionDetails?.label || 'Configurações'}
                </CardTitle>
                <CardDescription>
                    {currentSectionDetails?.description || 'Gerencie as configurações globais do BidExpert.'}
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <SettingsForm initialData={initialSettings} activeSection={activeSection} onUpdateSuccess={onRetry} />
                    {activeSection === 'general' && <DangerZone />}
                </CardContent>
            </Card>
        </div>
    );
}


export default function AdminSettingsPageWrapper() {
    const { toast } = useToast(); 
    const [initialSettings, setInitialSettings] = useState<PlatformSettings | null>(null);
    const [initialError, setInitialError] = useState<string | null>(null);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);

    const fetchInitialSettings = useCallback(async () => {
        setIsLoadingInitial(true);
        setInitialError(null);
        try {
            const settings = await getPlatformSettings();
            setInitialSettings(settings);
        } catch (err: any) {
            console.error("Failed to fetch initial settings for page:", err);
            const errorMessage = err.message || "Falha ao carregar configurações iniciais.";
            setInitialError(errorMessage);
            toast({ title: "Erro de Carregamento", description: errorMessage, variant: "destructive" });
        } finally {
            setIsLoadingInitial(false);
        }
    }, [toast]); 

    useEffect(() => {
        fetchInitialSettings();
    }, [fetchInitialSettings]);

    if (isLoadingInitial) {
        return (
             <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Carregando página de configurações...</p>
            </div>
        );
    }
    
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <AdminSettingsPageContent initialSettings={initialSettings} initialError={initialError} onRetry={fetchInitialSettings} />
        </Suspense>
    );
}
