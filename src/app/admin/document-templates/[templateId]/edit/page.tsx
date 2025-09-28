// src/app/admin/document-templates/[templateId]/edit/page.tsx
/**
 * @fileoverview Página para edição de um Template de Documento específico.
 * Este componente Server-Side busca os dados iniciais do template a ser editado
 * e os passa para o formulário `DocumentTemplateForm`. A ação de atualização
 * (`handleUpdateTemplate`) também é definida aqui e passada como prop, permitindo
 * a modificação de um template existente.
 */
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
