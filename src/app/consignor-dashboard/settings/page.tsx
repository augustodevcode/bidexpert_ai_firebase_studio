// src/app/consignor-dashboard/settings/page.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ConsignorSettingsPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <Settings className="h-7 w-7 mr-3 text-primary" />
            Configurações do Comitente
          </CardTitle>
          <CardDescription>
            Gerencie as informações do seu perfil de vendedor, dados de contato e preferências.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12 bg-secondary/30 rounded-lg">
          <h3 className="text-xl font-semibold text-muted-foreground">Em Desenvolvimento</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Esta seção permitirá que você edite os detalhes do seu perfil de vendedor.
          </p>
          <Button variant="outline" className="mt-6" asChild>
            <Link href="/consignor-dashboard/overview">Voltar para Visão Geral</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
