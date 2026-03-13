/**
 * @fileoverview Formulário de edição de Modelo de Veículo no Admin Plus.
 * Carrega modelo existente + lista de marcas em paralelo via Promise.all.
 */
'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { updateVehicleModelSchema, type UpdateVehicleModelInput } from '../schema';
import { getVehicleModelByIdAction, updateVehicleModelAction } from '../actions';
import { listVehicleMakesAction } from '../../vehicle-makes/actions';
import type { VehicleMake } from '@/types';

export default function EditVehicleModelPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [makes, setMakes] = useState<VehicleMake[]>([]);

  const form = useForm<UpdateVehicleModelInput>({
    resolver: zodResolver(updateVehicleModelSchema),
    defaultValues: { name: '', makeId: '' },
  });

  useEffect(() => {
    (async () => {
      const [modelResult, makesResult] = await Promise.all([
        getVehicleModelByIdAction({ id }),
        listVehicleMakesAction(undefined as never),
      ]);

      if (makesResult.success && makesResult.data) {
        setMakes(makesResult.data.data);
      }

      if (modelResult.success && modelResult.data) {
        form.reset({
          name: modelResult.data.name,
          makeId: modelResult.data.makeId,
        });
      } else {
        toast.error('Modelo não encontrado');
        router.push('/admin-plus/vehicle-models');
      }

      setIsLoading(false);
    })();
  }, [id, form, router]);

  const onSubmit = async (data: UpdateVehicleModelInput) => {
    setIsSubmitting(true);
    const result = await updateVehicleModelAction({ id, data });
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Modelo atualizado com sucesso');
      router.push('/admin-plus/vehicle-models');
    } else {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, msgs]) => {
          form.setError(field as keyof UpdateVehicleModelInput, { message: msgs[0] });
        });
      }
      toast.error(result.error ?? 'Erro ao atualizar modelo');
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Editar Modelo de Veículo"
          description="Carregando..."
          data-ai-id="vehicle-models-edit-page-header-loading"
        />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Editar Modelo de Veículo"
        description="Altere os dados do modelo de veículo."
        data-ai-id="vehicle-models-edit-page-header"
      />

      <CrudFormShell
        form={form}
        onSubmit={onSubmit}
        onCancel={() => router.push('/admin-plus/vehicle-models')}
        isSubmitting={isSubmitting}
        submitLabel="Salvar Alterações"
        data-ai-id="vehicle-models-edit-form"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Nome do Modelo" required>
            {({ field }) => (
              <Input
                {...field}
                value={field.value as string}
                onChange={field.onChange}
                placeholder="Ex: Civic"
                autoFocus
                data-ai-id="vehicle-model-edit-field-name"
              />
            )}
          </Field>

          <Field name="makeId" label="Marca" required>
            {({ field }) => (
              <Select
                value={field.value as string}
                onValueChange={field.onChange}
              >
                <SelectTrigger data-ai-id="vehicle-model-edit-field-makeId">
                  <SelectValue placeholder="Selecione a marca" />
                </SelectTrigger>
                <SelectContent>
                  {makes.map((make) => (
                    <SelectItem key={make.id} value={make.id}>
                      {make.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
        </div>
      </CrudFormShell>
    </>
  );
}
