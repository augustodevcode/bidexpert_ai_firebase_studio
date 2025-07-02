// src/app/admin/judicial-processes/page.tsx
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gavel } from 'lucide-react';

export default function AdminJudicialProcessesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Gavel className="mr-2 h-6 w-6" />Gerenciar Processos</CardTitle>
        <CardDescription>Esta funcionalidade está em desenvolvimento.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Em breve, você poderá criar, editar e gerenciar os processos judiciais vinculados aos lotes.</p>
      </CardContent>
    </Card>
  );
}
