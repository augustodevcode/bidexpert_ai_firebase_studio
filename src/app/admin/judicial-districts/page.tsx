// src/app/admin/judicial-districts/page.tsx
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Map } from 'lucide-react';

export default function AdminJudicialDistrictsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Map className="mr-2 h-6 w-6" />Gerenciar Comarcas</CardTitle>
        <CardDescription>Esta funcionalidade está em desenvolvimento.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Em breve, você poderá criar, editar e gerenciar as comarcas judiciais vinculadas aos tribunais.</p>
      </CardContent>
    </Card>
  );
}
