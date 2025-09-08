// src/app/admin/users/new/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import UserForm from '../user-form';
import { createUser, type UserFormData } from '../actions';
import { getRoles } from '@/app/admin/roles/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { UserPlus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Role } from '@/types';

function NewUserPageContent({ roles }: { roles: Role[] }) {
    const router = useRouter();
    const { toast } = useToast();
    
    async function handleCreateUser(data: UserFormData) {
        const result = await createUser(data);
        if (result.success) {
            toast({ title: 'Sucesso!', description: 'Usuário criado.' });
            router.push('/admin/users');
        } else {
            toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
        }
        return result;
    }
    
    return (
        <FormPageLayout
            pageTitle="Novo Usuário"
            pageDescription="Preencha os detalhes para criar uma nova conta de usuário."
            icon={UserPlus}
            isEdit={false}
        >
            {(formRef) => (
                <UserForm
                    ref={formRef}
                    roles={roles}
                    onSubmitAction={handleCreateUser}
                />
            )}
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
