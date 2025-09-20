// src/app/admin/states/new/page.tsx
/**
 * @fileoverview Página para criação de um novo Estado.
 * Este componente Server-Side renderiza o `StateForm` para entrada de dados
 * e passa a server action `createState` para persistir o novo registro,
 * permitindo a adição de novos estados na plataforma.
 */
import StateForm from '../state-form';
import { createState, type StateFormData } from '../actions';

export default async function NewStatePage() {
  async function handleCreateState(data: StateFormData) {
    'use server';
    return createState(data);
  }

  return (
    <StateForm
      onSubmitAction={handleCreateState}
      formTitle="Novo Estado"
      formDescription="Preencha os detalhes para cadastrar um novo estado."
      submitButtonText="Criar Estado"
    />
  );
}
