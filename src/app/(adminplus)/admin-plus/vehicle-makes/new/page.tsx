/**
 * @fileoverview Página de criação de VehicleMake no Admin Plus.
 */
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { ADMIN_PLUS_BASE_PATH } from '@/lib/admin-plus/constants';
import { createVehicleMakeSchema, type CreateVehicleMakeInput } from './schema';
import { createVehicleMakeAction } from './actions';

export default function NewVehicleMakePage() {
  const router = useRouter();
  const form = useForm<CreateVehicleMakeInput>({
    resolver: zodResolver(createVehicleMakeSchema),
    defaultValues: { name: '' },
  });

  const onSubmit = async (values: CreateVehicleMakeInput) => {
    const result = await createVehicleMakeAction(values);
    if (result.success) {
      toast.success('Marca criada com sucesso');
      router.push(`${ADMIN_PLUS_BASE_PATH}/vehicle-makes`);
    } else {
      toast.error(result.error ?? 'Erro ao criar');
    }
  };

  return (
    <div className="space-y-6" data-ai-id="vehicle-make-new-page">
      <PageHeader heading="Nova Marca" description="Cadastre uma nova marca de veículo. O slug será gerado automaticamente." />
      <CrudFormShell form={form} onSubmit={onSubmit} cancelHref={`${ADMIN_PLUS_BASE_PATH}/vehicle-makes`}>
        <Field control={form.control} name="name" label="Nome" required>
          {(field) => <Input {...field} placeholder="Ex: Toyota" data-ai-id="vehicle-make-name-input" />}
        </Field>
      </CrudFormShell>
    </div>
  );
}
