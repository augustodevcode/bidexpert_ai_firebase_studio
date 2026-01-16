
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2, Globe, Server } from 'lucide-react';

export default function DomainsSettingsPage() {
    const [domain, setDomain] = useState('leiloes.bidexpert.com.br');
    const [locawebToken, setLocawebToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleConfigure = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch('/api/admin/domains/configure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain, locawebToken })
            });

            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Failed to configure domain');
            }

            setResult(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 container mx-auto py-6 max-w-4xl">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Domínios & Infraestrutura</h2>
                <p className="text-muted-foreground">
                    Configure domínios personalizados e integ ração automática com provedores DNS.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Configuração de Domínio Personalizado
                    </CardTitle>
                    <CardDescription>
                        Conecte seu subdomínio (ex: leiloes.bidexpert.com.br) ao Firebase App Hosting e configure o DNS na Locaweb automaticamente.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="domain">Domínio / Subdomínio</Label>
                        <Input 
                            id="domain" 
                            placeholder="ex: leiloes.bidexpert.com.br" 
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            O domínio que você deseja utilizar para acessar a plataforma.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="token" className="flex items-center gap-2">
                            Token da API Locaweb
                            <span className="text-xs font-normal text-muted-foreground">(Opcional para configuração manual)</span>
                        </Label>
                        <Input 
                            id="token" 
                            type="password"
                            placeholder="Insira seu token de API da Locaweb" 
                            value={locawebToken}
                            onChange={(e) => setLocawebToken(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Necessário para criar os registros DNS automaticamente. Se deixar em branco, você receberá as instruções para configurar manualmente.
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Erro na Configuração</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {result && (
                        <div className="space-y-4 mt-4">
                            <Alert className="border-green-500 bg-green-50 dark:bg-green-900/10">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertTitle className="text-green-800 dark:text-green-400">Processo Iniciado</AlertTitle>
                                <AlertDescription className="text-green-700 dark:text-green-300">
                                    O domínio foi registrado no Firebase App Hosting.
                                </AlertDescription>
                            </Alert>

                            {result.manual_instructions && (
                                <div className="p-4 bg-muted rounded-md space-y-2">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <Server className="h-4 w-4" />
                                        Instruções Manuais DNS (Locaweb)
                                    </h4>
                                    <div className="text-sm space-y-2">
                                        <p>Adicione os seguintes registros no painel da Locaweb:</p>
                                        <div className="bg-background border p-2 rounded font-mono text-xs overflow-x-auto">
                                            {result.firebase_records && result.firebase_records.length > 0 ? (
                                                <ul className="list-disc pl-4 space-y-1">
                                                    {result.firebase_records.map((rec: any, i: number) => (
                                                        <li key={i}>
                                                            <strong>{rec.type}</strong>: {rec.host} &rarr; {rec.data}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p>Aguardando propagação do Firebase... Verifique o painel do Firebase ou tente novamente em alguns minutos.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {result.locaweb && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">Status Locaweb:</h4>
                                    <ul className="text-xs space-y-1">
                                        {result.locaweb.results.map((res: any, i: number) => (
                                            <li key={i} className={res.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                                                {res.status === 'success' ? '✅' : '❌'} {res.record.type} Record: {res.status === 'success' ? 'Criado' : res.details}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                </CardContent>
                <CardFooter>
                    <Button onClick={handleConfigure} disabled={loading} className="w-full">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Configurando...
                            </>
                        ) : (
                            'Configurar Domínio & DNS'
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
