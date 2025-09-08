// apps/web/src/app/admin/sellers/new/page.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SellerForm from '../seller-form';
import { createSeller } from '../actions';
import type { SellerFormData } from '@bidexpert/core';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Users, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { JudicialBranch } from '@bidexpert/core';
import { Button } from '@/components/ui/button';

export default function NewSellerPage() {
    const router = useRouter();
    const { toast } = useToast();
    const formRef = useRef<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [branches, setBranches] = useState<JudicialBranch[]>([]);
    const [isLoadingDependencies, setIsLoadingDependencies] = useState(true);
    
    useEffect(() => {
        getJudicialBranches().then(data => {
            setBranches(data);
            setIsLoadingDependencies(false);
        });
    }, []);

    const handleSave = () => {
        formRef.current?.requestSubmit();
    };

    async function handleCreateSeller(data: SellerFormData) {
        setIsSubmitting(true);
        const result = await createSeller(data);
        if (result.success) {
            toast({ title: 'Sucesso!', description: 'Comitente criado com sucesso.' });
            router.push('/admin/sellers');
        } else {
            toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
            setIsSubmitting(false);
        }
    }
    
    if (isLoadingDependencies) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                    <Users/>
                    Novo Comitente
                </CardTitle>
                <CardDescription>
                    Preencha os detalhes para cadastrar um novo comitente/vendedor.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <SellerForm
                    ref={formRef}
                    judicialBranches={branches}
                    onSubmitAction={handleCreateSeller}
                />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => router.push('/admin/sellers')} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Criar Comitente
                </Button>
            </CardFooter>
        </Card>
    );
}