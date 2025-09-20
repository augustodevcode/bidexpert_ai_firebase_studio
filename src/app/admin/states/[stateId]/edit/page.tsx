// src/app/admin/states/[stateId]/edit/page.tsx
/**
 * @fileoverview Página para edição de um Estado específico.
 * Este componente Server-Side busca os dados iniciais do estado a ser editado
 * e os passa para o formulário `StateForm`. A ação de atualização (`handleUpdateState`)
 * também é definida aqui e passada como prop, permitindo a modificação de um
 * estado existente na plataforma.
 */
import StateForm from '../../state-form';
import { getState, updateState, type StateFormData } from '../../actions';
import { notFound } from 'next/navigation';

export default async function EditStatePage({ params }: { params: { stateId: string } }) {
  const stateId = params.stateId;
  const state = await getState(stateId);

  if (!state) {
    notFound();
  }

  async function handleUpdateState(data: Partial<StateFormData>) {
    'use server';
    return updateState(stateId, data);
  }

  return (
    <StateForm
      initialData={state}
      onSubmitAction={handleUpdateState}
      formTitle="Editar Estado"
      formDescription="Modifique os detalhes do estado existente."
      submitButtonText="Salvar Alterações"
    />
  );
}
