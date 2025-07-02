// src/app/admin/courts/[courtId]/edit/page.tsx
import CourtForm from '../../court-form';
import { getCourt, updateCourt } from '../../actions';
import { getStates } from '@/app/admin/states/actions';
import { notFound } from 'next/navigation';

export default async function EditCourtPage({ params }: { params: { courtId: string } }) {
  const courtId = params.courtId;
  const court = await getCourt(courtId);
  const states = await getStates();

  if (!court) {
    notFound();
  }

  async function handleUpdateCourt(data: any) {
    'use server';
    return updateCourt(courtId, data);
  }

  return (
    <CourtForm
      initialData={court}
      states={states}
      onSubmitAction={handleUpdateCourt}
      formTitle="Editar Tribunal"
      formDescription="Modifique os detalhes do tribunal existente."
      submitButtonText="Salvar Alterações"
    />
  );
}
