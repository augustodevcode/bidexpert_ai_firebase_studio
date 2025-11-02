// src/app/admin/states/new/page.tsx
/**
 * @fileoverview Página para criação de um novo Estado.
 * Este componente Server-Side renderiza o `StateForm` para entrada de dados
 * e passa a server action `createState` para persistir o novo registro,
 * permitindo a adição de novos estados na plataforma.
 */
import StateForm from '../state-form';
import { createState, type StateFormData } from '../actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Map } from 'lucide-react';
import { useRouter } from 'next/navigation';


export default async function NewStatePage() {

  async function handleCreateState(data: StateFormData) {
    'use server';
    return createState(data);
  }

  return (
    <Card className="max-w-xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Map className="h-6 w-6 text-primary" /> Novo Estado</CardTitle>
        <CardDescription>Preencha os detalhes para cadastrar um novo estado.</CardDescription>
      </CardHeader>
      <CardContent>
        <StateForm
          onSubmitAction={handleCreateState}
        />
      </CardContent>
    </Card>
  );
}
