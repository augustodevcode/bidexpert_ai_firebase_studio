// src/app/admin/roles/[roleId]/edit/page.tsx
'use client';

import { RoleForm } from '../components/role-form';
import { getRole, updateRole, deleteRole } from '../../actions';
import type { RoleFormData } from '@bidexpert/core';
import { notFound, useRouter, useParams } from 'next/navigation';
import FormPageLayout from '@/components/admin/form-page-layout';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck } from 'lucide-react';
import type { Role } from '@bidexpert/core';

export default function EditRolePage() {
  const params = useParams();
  const roleId = params.roleId as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);
  const formRef = useRef<any>(null);

  const fetchPageData = useCallback(async () => {
    if (!roleId) return;
    setIsLoading(true);
    try {
        const fetchedRole = await getRole(roleId);
        if (!fetchedRole) {
            notFound();
            return;
        }
        setRole(fetchedRole);
    } catch(e) {
        console.error("Failed to fetch role", e);
        toast({title: "Erro", description: "Falha ao buscar dados do perfil.", variant: "destructive"})
    }
    setIsLoading(false);
  }, [roleId, toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  
  const handleFormSubmit = async (data: RoleFormData) => {
    setIsSubmitting(true);
    const result = await updateRole(roleId, data);
    if (result.success) {
        toast({ title: 'Sucesso!', description: 'Perfil atualizado.' });
        fetchPageData();
        setIsViewMode(true);
    } else {
        toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };
  
  const handleDelete = async () => {
    const result = await deleteRole(roleId);
     if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/roles');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  }

  const handleSave = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <FormPageLayout
        formTitle={isViewMode ? "Visualizar Perfil" : "Editar Perfil"}
        formDescription={role?.name || 'Carregando...'}
        icon={ShieldCheck}
        isViewMode={isViewMode}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        onEnterEditMode={() => setIsViewMode(false)}
        onCancel={() => setIsViewMode(true)}
        onSave={handleSave}
        onDelete={handleDelete}
    >
        <RoleForm
            ref={formRef}
            initialData={role}
            onSubmitAction={handleFormSubmit}
        />
    </FormPageLayout>
  );
}
