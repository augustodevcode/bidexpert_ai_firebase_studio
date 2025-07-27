// src/app/admin/habilitations/[userId]/page.tsx
import { getUserProfileData } from '@/app/admin/users/actions';
import { getUserDocumentsForReview } from '../actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, AlertCircle } from 'lucide-react';
import DocumentReviewClient from './document-review-client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUserHabilitationStatusInfo } from '@/lib/ui-helpers';
import { cn } from '@/lib/utils';

export default async function DocumentReviewPage({ params }: { params: { userId: string } }) {
  const { userId } = params;

  const [user, documents] = await Promise.all([
    getUserProfileData(userId),
    getUserDocumentsForReview(userId),
  ]);

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Usuário Não Encontrado</h1>
        <p className="text-muted-foreground">O usuário que você está tentando revisar não existe.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/habilitations">Voltar para a Lista</Link>
        </Button>
      </div>
    );
  }

  const statusInfo = getUserHabilitationStatusInfo(user.habilitationStatus);
  const statusColorClasses = statusInfo.textColor
    ? `border-l-4 ${statusInfo.textColor.replace('text-', 'border-')} ${statusInfo.textColor.replace(/-\d+$/, '/10')}`
    : 'border-l-4 border-muted-foreground bg-muted/20';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <Button variant="outline" size="sm" asChild>
        <Link href="/admin/habilitations"><ArrowLeft className="mr-2 h-4 w-4" />Voltar para Solicitações</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Revisão de Documentos: {user.fullName}
          </CardTitle>
          <CardDescription>
            E-mail: {user.email}
          </CardDescription>
        </CardHeader>
         <CardContent>
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status Atual:</span>
                <Badge variant="outline" className={cn(
                    'border-l-4',
                    statusInfo.textColor ? statusInfo.textColor.replace('text-', 'border-') : 'border-muted-foreground',
                    statusInfo.textColor ? statusInfo.textColor.replace(/-\d+$/, '/10').replace('text-', 'bg-') : 'bg-muted/20'
                )}>
                    <statusInfo.icon className={cn("h-4 w-4 mr-2", statusInfo.textColor)} />
                    {statusInfo.text}
                </Badge>
            </div>
        </CardContent>
      </Card>

      <DocumentReviewClient initialDocuments={documents} user={user} />
    </div>
  );
}
