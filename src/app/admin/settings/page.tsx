// src/app/admin/settings/page.tsx
'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getPlatformSettings, runFullSeedAction } from './actions';
import SettingsForm from './settings-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, AlertTriangle, Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Loader2 } from 'lucide-react';

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
    
    const handleAction = async (action: 'seed') => {
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
        <Card className="border-destructive mt-12">
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
                        Preenche o banco de dados com um conjunto completo de dados para testes, ignorando itens que já existem.
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

function AdminSettingsPageContent({ initialSettings, initialError, onRetry }: { 
    initialSettings: PlatformSettings | null;
    initialError?: string | null;
    onRetry?: () => void; 
}) {
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

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle className="text-2xl font-bold font-headline flex items-center">
                    <SettingsIcon className="h-7 w-7 mr-3 text-primary" />
                    Configurações da Plataforma
                </CardTitle>
                <CardDescription>
                    Gerencie as configurações globais do BidExpert.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <SettingsForm initialData={initialSettings} onUpdateSuccess={onRetry} />
                </CardContent>
            </Card>
            <DangerZone />
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
