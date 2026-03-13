/**
 * @fileoverview Formulário de criação de Modelo de Veículo no Admin Plus.
 * Inclui dropdown de Marca (makeId) como FK obrigatória.
 */
'use client';

import { useRouter } from 'next/navigation';
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
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { createVehicleModelSchema, type CreateVehicleModelInput } from '../schema';
import { createVehicleModelAction } from '../actions';
import { listVehicleMakesAction } from '../../vehicle-makes/actions';
import type { VehicleMake } from '@/types';

export default function NewVehicleModelPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [makes, setMakes] = useState<VehicleMake[]>([]);

  const form = useForm<CreateVehicleModelInput>({
    resolver: zodResolver(createVehicleModelSchema),
    defaultValues: { name: '', makeId: '' },
  });

  useEffect(() => {
    (async () => {
      const result = await listVehicleMakesAction(undefined as never);
      if (result.success && result.data) {
        setMakes(result.data.data);
      }
    })();
  }, []);

  const onSubmit = async (data: CreateVehicleModelInput) => {
    setIsSubmitting(true);
    const result = await createVehicleModelAction(data);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Modelo criado com sucesso');
      router.push('/admin-plus/vehicle-models');
    } else {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, msgs]) => {
          form.setError(field as keyof CreateVehicleModelInput, { message: msgs[0] });
        });
      }
      toast.error(result.error ?? 'Erro ao criar modelo');
    }
  };

  return (
    <>
      <PageHeader
        title="Novo Modelo de Veículo"
        description="Cadastre um novo modelo de veículo no sistema."
        data-ai-id="vehicle-models-new-page-header"
      />

      <CrudFormShell
        form={form}
        onSubmit={onSubmit}
        onCancel={() => router.push('/admin-plus/vehicle-models')}
        isSubmitting={isSubmitting}
        submitLabel="Criar Modelo"
        data-ai-id="vehicle-models-new-form"
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
                data-ai-id="vehicle-model-field-name"
              />
            )}
          </Field>

          <Field name="makeId" label="Marca" required>
            {({ field }) => (
              <Select
                value={field.value as string}
                onValueChange={field.onChange}
              >
                <SelectTrigger data-ai-id="vehicle-model-field-makeId">
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
