// src/app/admin/document-templates/[templateId]/edit/page.tsx
import DocumentTemplateForm from '../../document-template-form';
import { getDocumentTemplate, updateDocumentTemplate } from '../../actions';
import { notFound } from 'next/navigation';
import type { DocumentTemplateFormData } from '../../document-template-form-schema';

export default async function EditDocumentTemplatePage({ params }: { params: { templateId: string } }) {
  const templateId = params.templateId;
  const template = await getDocumentTemplate(templateId);

  if (!template) {
    notFound();
  }

  async function handleUpdateTemplate(data: Partial<DocumentTemplateFormData>) {
    'use server';
    return updateDocumentTemplate(templateId, data);
  }

  return (
    <DocumentTemplateForm
      initialData={template}
      onSubmitAction={handleUpdateTemplate}
      formTitle="Editar Template de Documento"
      formDescription="Modifique o nome, tipo e conteúdo do template."
      submitButtonText="Salvar Alterações"
    />
  );
}
