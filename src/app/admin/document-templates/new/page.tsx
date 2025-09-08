// src/app/admin/document-templates/new/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Files } from 'lucide-react';
import DocumentTemplateForm from '../document-template-form';
import { createDocumentTemplate, type DocumentTemplateFormData } from '../actions';
import FormPageLayout from '@/components/admin/form-page-layout';

export default function NewDocumentTemplatePage() {
    const router = useRouter();
    const { toast } = useToast();

    async function handleCreate(data: DocumentTemplateFormData) {
        const result = await createDocumentTemplate(data);
        if (result.success) {
            toast({ title: 'Sucesso!', description: 'Template criado com sucesso.' });
            router.push('/admin/document-templates');
        } else {
            toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
        }
        return result;
    }

    return (
        <FormPageLayout
            pageTitle="Novo Template de Documento"
            pageDescription="Crie um novo modelo para ser usado na geração de documentos."
            icon={Files}
            isEdit={false}
        >
            {(formRef) => (
                <DocumentTemplateForm
                    ref={formRef}
                    onSubmitAction={handleCreate}
                />
            )}
        </FormPageLayout>
    );
}
