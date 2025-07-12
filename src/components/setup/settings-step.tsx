// src/components/setup/settings-step.tsx
'use client';

import { useState, useRef } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updatePlatformSettings } from '@/app/admin/settings/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, Image as ImageIcon, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface SettingsStepProps {
  onNext: () => void;
  onPrev: () => void;
}

const settingsSchema = z.object({
  siteTitle: z.string().min(3, { message: 'O título do site é obrigatório.' }),
  siteTagline: z.string().optional(),
  logoUrl: z.string().url("URL do logo inválida.").optional().or(z.literal('')),
  faviconUrl: z.string().url("URL do favicon inválida.").optional().or(z.literal('')),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const MAX_LOGO_SIZE_MB = 2;
const MAX_LOGO_SIZE_BYTES = MAX_LOGO_SIZE_MB * 1024 * 1024;

export default function SettingsStep({ onNext, onPrev }: SettingsStepProps) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            siteTitle: 'BidExpert Leilões',
            siteTagline: 'Sua plataforma especialista em leilões online.',
            logoUrl: '',
            faviconUrl: '',
        },
    });
    
    const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setFileError(null);
        if (file) {
            if (file.size > MAX_LOGO_SIZE_BYTES) {
                setFileError(`Arquivo muito grande. O tamanho máximo para o logo é ${MAX_LOGO_SIZE_MB}MB.`);
                setLogoFile(null);
                setLogoPreview(null);
                return;
            }
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };
    
    const uploadFile = async (file: File): Promise<string | null> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', 'site-assets');

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                const errorMsg = result.errors?.[0]?.message || result.message || `Falha no servidor (Status: ${response.status}).`;
                console.error(`[Upload Error] HTTP Status: ${response.status}. Response Body:`, result);
                throw new Error(errorMsg);
            }
            
            if (result.success && result.urls && result.urls.length > 0) {
                return result.urls[0];
            } else {
                const errorMsg = result.errors?.[0]?.message || result.message || 'Falha no upload do arquivo.';
                console.error('[Upload Error] Server responded OK, but operation failed. Result:', result);
                throw new Error(errorMsg);
            }
        } catch (error: any) {
            toast({ title: 'Erro de Upload', description: error.message, variant: 'destructive' });
            return null;
        }
    };

    const handleSaveAndContinue = async (values: SettingsFormValues) => {
        setIsSaving(true);
        let finalLogoUrl = values.logoUrl;

        if (logoFile) {
            const uploadedUrl = await uploadFile(logoFile);
            if (uploadedUrl) {
                finalLogoUrl = uploadedUrl;
            } else {
                setIsSaving(false);
                return;
            }
        }

        try {
            const result = await updatePlatformSettings({ ...values, logoUrl: finalLogoUrl });
            if (result.success) {
                toast({ title: "Sucesso!", description: "Configurações salvas com sucesso." });
                onNext();
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Erro inesperado", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };


  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSaveAndContinue)}>
            <CardHeader>
                <CardTitle>Configurações da Plataforma</CardTitle>
                <CardDescription>Defina as configurações iniciais do seu site. Você poderá alterá-las depois no painel de administração.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField control={form.control} name="siteTitle" render={({ field }) => (<FormItem><FormLabel>Título do Site</FormLabel><FormControl><Input placeholder="Ex: Leilões do Brasil" {...field} /></FormControl><FormDescription>O nome principal que aparecerá na sua plataforma.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="siteTagline" render={({ field }) => (<FormItem><FormLabel>Slogan / Tagline (Opcional)</FormLabel><FormControl><Input placeholder="Ex: As melhores oportunidades, a um lance de distância." {...field} /></FormControl><FormDescription>Uma frase curta que descreve o seu site.</FormDescription><FormMessage /></FormItem>)} />
                <FormItem>
                  <FormLabel>Logo do Site</FormLabel>
                   <div className="flex items-center gap-4">
                        <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border flex items-center justify-center">
                            {logoPreview ? (
                                <Image src={logoPreview} alt="Prévia do Logo" fill className="object-contain" />
                            ) : (
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            )}
                        </div>
                        <div className="flex-grow space-y-2">
                           <FormControl>
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="logo-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary/50">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                            <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste</p>
                                        </div>
                                        <input id="logo-upload" type="file" className="hidden" onChange={handleLogoFileChange} accept="image/png, image/jpeg, image/svg+xml, image/webp" />
                                    </label>
                                </div>
                            </FormControl>
                            <FormField control={form.control} name="logoUrl" render={({ field }) => (<FormControl><Input type="text" placeholder="Ou cole a URL aqui" {...field} className="text-xs h-8" /></FormControl>)} />
                        </div>
                    </div>
                  <FormDescription>Máximo de {MAX_LOGO_SIZE_MB}MB. Formatos: PNG, JPG, WEBP, SVG.</FormDescription>
                  {fileError && <p className="text-sm font-medium text-destructive flex items-center gap-1"><AlertCircle className="h-4 w-4"/> {fileError}</p>}
                  <FormMessage>{form.formState.errors.logoUrl?.message}</FormMessage>
                </FormItem>
                <FormField control={form.control} name="faviconUrl" render={({ field }) => (<FormItem><FormLabel>URL do Favicon (Opcional)</FormLabel><FormControl><Input placeholder="Cole a URL para o seu .ico ou .png" {...field} /></FormControl><FormDescription>Ícone que aparece na aba do navegador. Upload direto será adicionado futuramente.</FormDescription><FormMessage /></FormItem>)} />
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={onPrev} disabled={isSaving}>Voltar</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Salvar e Avançar
                </Button>
            </CardFooter>
        </form>
    </Form>
  );
}
