// src/app/admin/users/new/page.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import UserForm from '../user-form';
import { createUser, type UserFormData } from '../actions';
import { getRoles } from '@/app/admin/roles/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Role } from '@/types';

function NewUserPageContent({ roles }: { roles: Role[] }) {
    const router = useRouter();
    const { toast } = useToast();
    const formRef = useRef<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSave = () => {
        formRef.current?.requestSubmit();
    };

    async function handleCreateUser(data: UserFormData) {
        setIsSubmitting(true);
        const result = await createUser(data);
        if (result.success) {
            toast({ title: 'Sucesso!', description: 'Usuário criado.' });
            router.push('/admin/users');
        } else {
            toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
            setIsSubmitting(false); // Only stop loading on error, success will navigate away
        }
    }
    
    return (
        <FormPageLayout
            formTitle="Novo Usuário"
            formDescription="Preencha os detalhes para criar uma nova conta de usuário."
            icon={UserPlus}
            isViewMode={false} // Always in edit mode for new page
            isSubmitting={isSubmitting}
            onSave={handleSave}
            onCancel={() => router.push('/admin/users')}
        >
            <UserForm
                ref={formRef}
                roles={roles}
                onSubmitAction={handleCreateUser}
            />
        </FormPageLayout>
    );
}

export default function NewUserPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getRoles().then(data => {
            setRoles(data);
            setIsLoading(false);
        })
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>
    }

    return <NewUserPageContent roles={roles} />;
}
