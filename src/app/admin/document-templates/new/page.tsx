// src/app/admin/document-templates/new/page.tsx
/**
 * @fileoverview Página para criação de um novo Template de Documento.
 * Este componente Server-Side renderiza o `DocumentTemplateForm` para entrada de dados
 * e passa a server action `createDocumentTemplate` para persistir o novo registro,
 * permitindo que um administrador crie novos modelos de documentos para o sistema.
 */
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
