/**
 * @fileoverview Página de edição de VehicleMake no Admin Plus.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { ADMIN_PLUS_BASE_PATH } from '@/lib/admin-plus/constants';
import { createVehicleMakeSchema, type CreateVehicleMakeInput } from '../schema';
import { getVehicleMakeByIdAction, updateVehicleMakeAction } from '../actions';

export default function EditVehicleMakePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const form = useForm<CreateVehicleMakeInput>({
    resolver: zodResolver(createVehicleMakeSchema),
    defaultValues: { name: '' },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await getVehicleMakeByIdAction({ id });
    if (result.success && result.data) {
      form.reset({ name: result.data.name });
    } else {
      toast.error(result.error ?? 'Marca não encontrada');
      router.push(`${ADMIN_PLUS_BASE_PATH}/vehicle-makes`);
    }
    setLoading(false);
  }, [id, form, router]);

  useEffect(() => { loadData(); }, [loadData]);

  const onSubmit = async (values: CreateVehicleMakeInput) => {
    const result = await updateVehicleMakeAction({ id, data: values });
    if (result.success) {
      toast.success('Marca atualizada com sucesso');
      router.push(`${ADMIN_PLUS_BASE_PATH}/vehicle-makes`);
    } else {
      toast.error(result.error ?? 'Erro ao atualizar');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" data-ai-id="vehicle-make-edit-skeleton">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-ai-id="vehicle-make-edit-page">
      <PageHeader heading="Editar Marca" description="Altere o nome da marca. O slug será regenerado automaticamente." />
      <CrudFormShell form={form} onSubmit={onSubmit} cancelHref={`${ADMIN_PLUS_BASE_PATH}/vehicle-makes`} isEditing>
        <Field control={form.control} name="name" label="Nome" required>
          {(field) => <Input {...field} placeholder="Ex: Toyota" data-ai-id="vehicle-make-name-input" />}
        </Field>
      </CrudFormShell>
    </div>
  );
}
