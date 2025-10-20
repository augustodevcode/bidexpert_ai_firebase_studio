// src/app/admin/settings/increments/page.tsx
/**
 * @fileoverview Página de administração para as configurações da Tabela de Incremento Variável.
 * Permite ao administrador definir as faixas de valores e os incrementos mínimos
 * correspondentes para os lances.
 */
'use client';

import React from 'react';
import SettingsFormWrapper from '../settings-form-wrapper';
import { useFieldArray } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';

export default function VariableIncrementSettingsPage() {
  return (
    <SettingsFormWrapper
      title="Tabela de Incremento Variável"
      description="Defina os incrementos mínimos de lance com base em faixas de valor."
    >
      {(form) => {
        const { fields, append, remove } = useFieldArray({
          control: form.control,
          name: 'variableIncrementTable',
        });

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md bg-background">
                  <FormField
                    control={form.control}
                    name={`variableIncrementTable.${index}.from`}
                    render={({ field: fromField }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">De (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" {...fromField} value={fromField.value ?? ''} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`variableIncrementTable.${index}.to`}
                    render={({ field: toField }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Até (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="em diante" {...toField} value={toField.value ?? ''} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`variableIncrementTable.${index}.increment`}
                    render={({ field: incField }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Incremento (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" {...incField} value={incField.value ?? ''} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="h-9 w-9 flex-shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ from: 0, to: null, increment: 0 })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Faixa
            </Button>
          </div>
        );
      }}
    </SettingsFormWrapper>
  );
}
