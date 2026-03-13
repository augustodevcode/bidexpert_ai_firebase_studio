/**
 * @fileoverview Tipos compartilhados para Report no Admin Plus.
 */

export interface ReportRow {
  id: string;
  name: string;
  description: string;
  definitionPreview: string;
  definitionText: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}