// src/app/admin/vehicle-models/new/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import VehicleModelForm from '../vehicle-model-form';
import { createVehicleModel, type VehicleModelFormData } from '../actions';
import { getVehicleMakes } from '@/app/admin/vehicle-makes/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Car, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { VehicleMake } from '@/types';

function NewVehicleModelPageContent({ makes }: { makes: VehicleMake[] }) {
    const router = useRouter();
    const { toast } = useToast();
    
    async function handleCreate(data: VehicleModelFormData) {
        const result = await createVehicleModel(data);
        if (result.success) {
            toast({ title: 'Sucesso!', description: 'Modelo criado.' });
            router.push('/admin/vehicle-models');
        } else {
            toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
        }
        return result;
    }
    
    return (
        <FormPageLayout
            pageTitle="Novo Modelo de Veículo"
            pageDescription="Cadastre um novo modelo e vincule-o a uma marca."
            icon={Car}
            isEdit={false}
        >
            {(formRef) => (
                <VehicleModelForm
                    ref={formRef}
                    makes={makes}
                    onSubmitAction={handleCreate}
                />
            )}
        </FormPageLayout>
    );
}


export default function NewVehicleModelPage() {
    const [makes, setMakes] = useState<VehicleMake[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getVehicleMakes().then(data => {
            setMakes(data);
            setIsLoading(false);
        });
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>
    }

    return <NewVehicleModelPageContent makes={makes} />;
}
