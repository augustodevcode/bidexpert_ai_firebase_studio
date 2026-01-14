'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function TicketSuccessPage() {
  return (
    <div className="container flex items-center justify-center min-h-[60vh] py-10">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-500" />
          </div>
          <CardTitle className="text-2xl">Ticket Criado!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Recebemos sua solicitação e nossa equipe já foi notificada.
            Você será respondido em breve.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/">Voltar ao Início</Link>
            </Button>
            {/* If there was a ticket list for users, link there. Assuming no user list yet. */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
