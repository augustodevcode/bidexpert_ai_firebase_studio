/**
 * Tipos para listagem de DocumentTemplate.
 */
export interface DocumentTemplateRow {
  id: string;
  name: string;
  type: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}
