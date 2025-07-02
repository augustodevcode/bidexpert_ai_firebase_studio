// src/app/admin/judicial-branches/page.tsx
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export default function AdminJudicialBranchesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Building2 className="mr-2 h-6 w-6" />Gerenciar Varas</CardTitle>
        <CardDescription>Esta funcionalidade está em desenvolvimento.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Em breve, você poderá criar, editar e gerenciar as varas judiciais vinculadas às comarcas.</p>
      </CardContent>
    </Card>
  );
}
