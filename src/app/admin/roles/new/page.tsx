// src/app/admin/roles/new/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck } from 'lucide-react';
import RoleForm from '../role-form';
import { createRole } from '../actions';
import type { RoleFormData } from '@bidexpert/core';
import FormPageLayout from '@/components/admin/form-page-layout';


export default function NewRolePage() {
  const router = useRouter();
  const { toast } = useToast();
  
  async function handleCreateRole(data: RoleFormData) {
    const result = await createRole(data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Perfil criado.' });
      router.push('/admin/roles');
    } else {
      toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
    }
    return result;
  }

  return (
    <FormPageLayout
        pageTitle="Novo Perfil de Usuário"
        pageDescription="Defina o nome, descrição e permissões para um novo perfil."
        icon={ShieldCheck}
        isEdit={false}
    >
        {(formRef) => (
            <RoleForm
                ref={formRef}
                onSubmitAction={handleCreateRole}
            />
        )}
    </FormPageLayout>
  );
}
