// apps/web/src/app/admin/sellers/new/page.tsx
'use client';

import React from 'react';
import SellerForm from '../seller-form';
import { criarComitente } from '../actions';
import type { SellerFormData } from '@bidexpert/core';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Users } from 'lucide-react';

export default function NewSellerPage() {
  const [judicialBranches, setJudicialBranches] = React.useState<any[]>([]);

  React.useEffect(() => {
    getJudicialBranches().then(setJudicialBranches);
  }, []);

  return (
    <FormPageLayout
      pageTitle="Novo Comitente"
      pageDescription="Preencha os detalhes para cadastrar um novo comitente/vendedor."
      icon={Users}
      isEdit={false}
    >
      {(formRef, initialData, handleSubmit) => (
        <SellerForm
          ref={formRef}
          judicialBranches={judicialBranches}
          onSubmitAction={(data) => handleSubmit(async () => criarComitente(data), '/admin/sellers')}
        />
      )}
    </FormPageLayout>
  );
}
