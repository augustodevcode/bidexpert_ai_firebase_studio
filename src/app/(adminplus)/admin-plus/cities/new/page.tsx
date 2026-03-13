/**
 * @fileoverview Formulário de criação de Cidade no Admin Plus.
 * Inclui dropdown de Estado (stateId) como FK obrigatória.
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
import { createCitySchema, type CreateCityInput } from '../schema';
import { createCityAction } from '../actions';
import { listStatesAction } from '../../states/actions';
import type { StateInfo } from '@/types';

export default function NewCityPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [states, setStates] = useState<StateInfo[]>([]);

  const form = useForm<CreateCityInput>({
    resolver: zodResolver(createCitySchema),
    defaultValues: { name: '', stateId: '', ibgeCode: '', latitude: null, longitude: null },
  });

  useEffect(() => {
    (async () => {
      const result = await listStatesAction(undefined as never);
      if (result.success && result.data) {
        setStates(result.data.data);
      }
    })();
  }, []);

  const onSubmit = async (data: CreateCityInput) => {
    setIsSubmitting(true);
    const result = await createCityAction(data);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Cidade criada com sucesso');
      router.push('/admin-plus/cities');
    } else {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, msgs]) => {
          form.setError(field as keyof CreateCityInput, { message: msgs[0] });
        });
      }
      toast.error(result.error ?? 'Erro ao criar cidade');
    }
  };

  return (
    <>
      <PageHeader
        title="Nova Cidade"
        description="Cadastre uma nova cidade no sistema."
        data-ai-id="cities-new-page-header"
      />

      <CrudFormShell
        form={form}
        onSubmit={onSubmit}
        onCancel={() => router.push('/admin-plus/cities')}
        isSubmitting={isSubmitting}
        submitLabel="Criar Cidade"
        data-ai-id="cities-new-form"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Nome" required>
            {({ field }) => (
              <Input
                {...field}
                value={field.value as string}
                onChange={field.onChange}
                placeholder="Ex: São Paulo"
                autoFocus
                data-ai-id="city-field-name"
              />
            )}
          </Field>

          <Field name="stateId" label="Estado" required>
            {({ field }) => (
              <Select
                value={field.value as string}
                onValueChange={field.onChange}
              >
                <SelectTrigger data-ai-id="city-field-stateId">
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.id}>
                      {state.name} ({state.uf})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="ibgeCode" label="Código IBGE">
            {({ field }) => (
              <Input
                {...field}
                value={(field.value as string) ?? ''}
                onChange={field.onChange}
                placeholder="Ex: 3550308"
                data-ai-id="city-field-ibgeCode"
              />
            )}
          </Field>

          <Field name="latitude" label="Latitude">
            {({ field }) => (
              <Input
                {...field}
                value={field.value != null ? String(field.value) : ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                type="number"
                step="any"
                placeholder="-23.5505"
                data-ai-id="city-field-latitude"
              />
            )}
          </Field>

          <Field name="longitude" label="Longitude">
            {({ field }) => (
              <Input
                {...field}
                value={field.value != null ? String(field.value) : ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                type="number"
                step="any"
                placeholder="-46.6333"
                data-ai-id="city-field-longitude"
              />
            )}
          </Field>
        </div>
      </CrudFormShell>
    </>
  );
}
