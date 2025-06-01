
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <Bell className="h-7 w-7 mr-3 text-primary" />
            Notificações
          </CardTitle>
          <CardDescription>
            Sua central de mensagens e alertas importantes da plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12 bg-secondary/30 rounded-lg">
          <h3 className="text-xl font-semibold text-muted-foreground">Nenhuma Notificação Nova</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Quando houver novas notificações, elas aparecerão aqui.
          </p>
           <p className="text-xs text-muted-foreground mt-1">
            (Funcionalidade em desenvolvimento)
          </p>
          <Button variant="outline" className="mt-6" asChild>
            <Link href="/dashboard/overview">Voltar para Visão Geral</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
