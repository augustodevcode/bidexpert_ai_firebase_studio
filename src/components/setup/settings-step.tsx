// src/components/setup/settings-step.tsx
'use client';

import { useState } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updatePlatformSettings } from '@/app/admin/settings/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SettingsStepProps {
  onNext: () => void;
  onPrev: () => void;
}

const settingsSchema = z.object({
  siteTitle: z.string().min(3, { message: 'O título do site é obrigatório.' }),
  siteTagline: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsStep({ onNext, onPrev }: SettingsStepProps) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            siteTitle: 'BidExpert Leilões',
            siteTagline: 'Sua plataforma especialista em leilões online.'
        },
    });

    const handleSaveAndContinue = async (values: SettingsFormValues) => {
        setIsSaving(true);
        try {
            const result = await updatePlatformSettings(values);
            if (result.success) {
                toast({
                    title: "Sucesso!",
                    description: "Configurações salvas com sucesso."
                });
                onNext();
            } else {
                toast({
                    title: "Erro",
                    description: result.message,
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            toast({
                title: "Erro inesperado",
                description: error.message,
                variant: "destructive"
            });
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
                <FormField
                    control={form.control}
                    name="siteTitle"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Título do Site</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Leilões do Brasil" {...field} />
                            </FormControl>
                            <FormDescription>
                                O nome principal que aparecerá na sua plataforma.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="siteTagline"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Slogan / Tagline (Opcional)</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: As melhores oportunidades, a um lance de distância." {...field} />
                            </FormControl>
                            <FormDescription>
                                Uma frase curta que descreve o seu site.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
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
