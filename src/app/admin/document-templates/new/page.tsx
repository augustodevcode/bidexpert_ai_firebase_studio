// src/app/admin/document-templates/new/page.tsx
import DocumentTemplateForm from '../document-template-form';
import { createDocumentTemplate } from '../actions';
import type { DocumentTemplateFormData } from '../document-template-form-schema';

export default async function NewDocumentTemplatePage() {

  async function handleCreateTemplate(data: DocumentTemplateFormData) {
    'use server';
    return createDocumentTemplate(data);
  }

  return (
    <DocumentTemplateForm
      onSubmitAction={handleCreateTemplate}
      formTitle="Novo Template de Documento"
      formDescription="Crie um novo modelo para ser usado na geração de documentos."
      submitButtonText="Criar Template"
    />
  );
}
