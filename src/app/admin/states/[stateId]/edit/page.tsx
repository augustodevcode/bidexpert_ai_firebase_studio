
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
    
