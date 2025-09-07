// src/app/admin/document-templates/[templateId]/edit/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
import DocumentTemplateForm from '../../document-template-form';
import { getDocumentTemplate, updateDocumentTemplate, deleteDocumentTemplate, type DocumentTemplateFormData } from '../../actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { useToast } from '@/hooks/use-toast';
import { Files } from 'lucide-react';
import type { DocumentTemplate } from '@/types';

export default function EditDocumentTemplatePage() {
  const params = useParams();
  const templateId = params.templateId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);
  const formRef = useRef<any>(null);

  const fetchPageData = useCallback(async () => {
    if (!templateId) return;
    setIsLoading(true);
    try {
      const fetchedTemplate = await getDocumentTemplate(templateId);
      if (!fetchedTemplate) {
        notFound();
        return;
      }
      setTemplate(fetchedTemplate);
    } catch (e) {
      console.error("Failed to fetch document template:", e);
      toast({ title: "Erro", description: "Falha ao buscar dados do template.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [templateId, toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleFormSubmit = async (data: Partial<DocumentTemplateFormData>) => {
    setIsSubmitting(true);
    const result = await updateDocumentTemplate(templateId, data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Template atualizado.' });
      fetchPageData();
      setIsViewMode(true);
    } else {
      toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };
  
  const handleDelete = async () => {
    const result = await deleteDocumentTemplate(templateId);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/document-templates');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  };

  const handleSave = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <FormPageLayout
      formTitle={isViewMode ? "Visualizar Template" : "Editar Template"}
      formDescription={template?.name || 'Carregando...'}
      icon={Files}
      isViewMode={isViewMode}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onEnterEditMode={() => setIsViewMode(false)}
      onCancel={() => setIsViewMode(true)}
      onSave={handleSave}
      onDelete={handleDelete}
    >
      <DocumentTemplateForm
        ref={formRef}
        initialData={template}
        onSubmitAction={handleFormSubmit}
      />
    </FormPageLayout>
  );
}
