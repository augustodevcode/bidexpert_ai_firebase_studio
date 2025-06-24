
'use client';

import { useEffect, useState, Suspense, useCallback } from 'react'; // Added useCallback
import { useRouter, useSearchParams } from 'next/navigation';
import { getPlatformSettings } from './actions';
import SettingsForm from './settings-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, Palette, Fingerprint, Wrench, Loader2, MapPin, Search as SearchIconLucide, Clock as ClockIcon, Link2, Database } from 'lucide-react'; // Adicionado SearchIconLucide, ClockIcon, LinkIcon, Database
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { PlatformSettings } from '@/types';
import { useToast } from '@/hooks/use-toast'; 

const settingsSections = [
    { id: 'identity', label: 'Identidade do Site', icon: Fingerprint, description: 'Título, tagline, logo e favicon.' },
    { id: 'general', label: 'Configurações Gerais', icon: Wrench, description: 'Caminhos de mídia, máscaras de ID, etc.' },
    { id: 'storage', label: 'Armazenamento', icon: Database, description: 'Configure onde os arquivos de mídia são salvos.' },
    { id: 'appearance', label: 'Aparência e Exibição', icon: Palette, description: 'Gerencie temas, paginação e cronômetros.' }, // Renomeado e combinadp
    { id: 'maps', label: 'Configurações de Mapa', icon: MapPin, description: 'Provedor de mapa padrão e chaves API.' },
];

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
                    <section.icon className="mr-2 h-5 w-5" />
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
