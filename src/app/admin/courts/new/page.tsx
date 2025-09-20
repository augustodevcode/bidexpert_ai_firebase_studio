// src/app/admin/courts/new/page.tsx
/**
 * @fileoverview Página para criação de um novo Tribunal.
 * Este componente Server-Side busca os dados necessários para os seletores
 * (a lista de estados) e renderiza o `CourtForm` para a entrada de dados.
 */
import CourtForm from '../court-form';
import { createCourt } from '../actions';
import { getStates } from '@/app/admin/states/actions';

export default async function NewCourtPage() {
  const states = await getStates();
  
  async function handleCreateCourt(data: any) {
    'use server';
    return createCourt(data);
  }

  return (
    <CourtForm
      states={states}
      onSubmitAction={handleCreateCourt}
      formTitle="Novo Tribunal"
      formDescription="Preencha os detalhes para cadastrar um novo tribunal de justiça."
      submitButtonText="Criar Tribunal"
    />
  );
}
