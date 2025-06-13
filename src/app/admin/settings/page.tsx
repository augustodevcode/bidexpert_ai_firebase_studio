
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPlatformSettings } from './actions';
import SettingsForm from './settings-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, Palette, Fingerprint, Wrench, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { PlatformSettings } from '@/types';

const settingsSections = [
    { id: 'identity', label: 'Identidade do Site', icon: Fingerprint, description: 'Título, tagline, logo e favicon.' },
    { id: 'general', label: 'Configurações Gerais', icon: Wrench, description: 'Caminhos de mídia, máscaras de ID, etc.' },
    { id: 'appearance', label: 'Aparência e Temas', icon: Palette, description: 'Gerencie temas de cores e estilos visuais.' },
];

interface AdminSettingsPageContentProps {
    initialSettings: PlatformSettings | null; // Pode ser nulo se houver erro
    initialError?: string | null;
}

function AdminSettingsPageContent({ initialSettings, initialError }: AdminSettingsPageContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [settings, setSettings] = useState<PlatformSettings | null>(initialSettings);
    const [error, setError] = useState<string | null>(initialError || null);
    const [activeSection, setActiveSection] = useState<string>('identity');

    useEffect(() => {
        const section = searchParams.get('section');
        if (section && settingsSections.some(s => s.id === section)) {
            setActiveSection(section);
        } else if (settingsSections.length > 0) {
            setActiveSection(settingsSections[0].id);
        }
    }, [searchParams]);

    if (error) {
        return (
             <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold font-headline flex items-center text-destructive">
                    <SettingsIcon className="h-7 w-7 mr-3" />
                    Erro ao Carregar Configurações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-destructive-foreground">{error}</p>
                  <Button onClick={() => router.refresh()} className="mt-4">Tentar Novamente</Button>
                </CardContent>
            </Card>
        );
    }
    
    if (!settings) {
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
                    <Link href={`?section=${section.id}`}>
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
                    <SettingsForm initialData={settings} activeSection={activeSection} />
                </CardContent>
            </Card>
        </div>
    );
}


export default function AdminSettingsPageWrapper() {
    // Esta parte agora executa no servidor para buscar os dados iniciais
    const [initialSettings, setInitialSettings] = React.useState<PlatformSettings | null>(null);
    const [initialError, setInitialError] = React.useState<string | null>(null);
    const [isLoadingInitial, setIsLoadingInitial] = React.useState(true);

    React.useEffect(() => {
        getPlatformSettings()
            .then(setInitialSettings)
            .catch(err => {
                console.error("Failed to fetch initial settings for page:", err);
                setInitialError(err.message || "Falha ao carregar configurações iniciais.");
            })
            .finally(() => setIsLoadingInitial(false));
    }, []);

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
            <AdminSettingsPageContent initialSettings={initialSettings} initialError={initialError} />
        </Suspense>
    );
}

    