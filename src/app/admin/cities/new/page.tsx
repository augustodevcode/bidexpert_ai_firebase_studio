
import CityForm from '../city-form';
import { createCity, type CityFormData } from '../actions';
import { getStates } from '@/app/admin/states/actions'; // Importar getStates

export default async function NewCityPage() {
  const states = await getStates(); // Buscar todos os estados

  async function handleCreateCity(data: CityFormData) {
    'use server';
    return createCity(data);
  }

  return (
    <CityForm
      states={states} // Passar os estados para o formulário
      onSubmitAction={handleCreateCity}
      formTitle="Nova Cidade"
      formDescription="Preencha os detalhes para cadastrar uma nova cidade e associe-a a um estado."
      submitButtonText="Criar Cidade"
    />
  );
}
    
