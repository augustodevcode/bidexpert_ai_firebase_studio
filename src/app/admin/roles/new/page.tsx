// src/app/admin/roles/new/page.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RoleForm from '../role-form';
import { createRole } from '../actions';
import type { RoleFormData } from '@bidexpert/core';
import FormPageLayout from '@/components/admin/form-page-layout';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NewRolePage() {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSave = () => {
    formRef.current?.requestSubmit();
  };
  
  async function handleCreateRole(data: RoleFormData) {
    setIsSubmitting(true);
    const result = await createRole(data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Perfil criado.' });
      router.push('/admin/roles');
    } else {
      toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
      setIsSubmitting(false); // Only stop loading on error
    }
  }

  return (
    <FormPageLayout
        formTitle="Novo Perfil de Usuário"
        formDescription="Defina o nome, descrição e permissões para um novo perfil."
        icon={ShieldCheck}
        isViewMode={false} // Always in edit mode
        isSubmitting={isSubmitting}
        onSave={handleSave}
        onCancel={() => router.push('/admin/roles')}
    >
        <RoleForm
            ref={formRef}
            onSubmitAction={handleCreateRole}
        />
    </FormPageLayout>
  );
}
