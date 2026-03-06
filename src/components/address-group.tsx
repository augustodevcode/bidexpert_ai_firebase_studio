/**
 * @fileoverview Wrapper de compatibilidade retroativa para o AddressGroup.
 * 
 * @deprecated Use `import { AddressComponent } from '@/components/address'` diretamente.
 * Este arquivo re-exporta o novo AddressComponent, aceitando as props legadas
 * (allCities, allStates) e mapeando-as para as novas (initialCities, initialStates).
 * 
 * Mantido apenas para que os 5+ formulários existentes que importam
 * `@/components/address-group` continuem funcionando sem alteração imediata.
 */
'use client';

import * as React from 'react';
import { UseFormReturn } from 'react-hook-form';
import type { CityInfo, StateInfo } from '@/types';
import AddressComponent from './address/AddressComponent';

interface AddressGroupProps {
  form: UseFormReturn<any>;
  allCities: CityInfo[];
  allStates: StateInfo[];
}

/**
 * @deprecated Migrar para `<AddressComponent form={form} />`.
 * O novo componente busca states/cities automaticamente.
 */
export default function AddressGroup({ form, allCities = [], allStates = [] }: AddressGroupProps) {
  return (
    <AddressComponent
      form={form}
      mode="relational"
      initialStates={allStates}
      initialCities={allCities}
    />
  );
}
