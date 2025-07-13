// src/app/admin/cities/[cityId]/edit/page.tsx
import CityForm from '../../city-form';
import { getCity, updateCity, type CityFormData } from '../../actions';
import { getStates } from '@/app/admin/states/actions'; 
import { notFound } from 'next/navigation';

export default async function EditCityPage({ params }: { params: { cityId: string } }) {
  const cityId = params.cityId;
  const [city, states] = await Promise.all([
    getCity(cityId),
    getStates()
  ]);

  if (!city) {
    notFound();
  }

  async function handleUpdateCity(data: Partial<CityFormData>) {
    'use server';
    return updateCity(cityId, data);
  }

  return (
    <CityForm
      initialData={city}
      states={states}
      onSubmitAction={handleUpdateCity}
      formTitle="Editar Cidade"
      formDescription="Modifique os detalhes da cidade existente."
      submitButtonText="Salvar Alterações"
    />
  );
}
