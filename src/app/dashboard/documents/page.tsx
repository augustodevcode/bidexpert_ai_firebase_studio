
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { UploadCloud, Eye, AlertCircle, CheckCircle2, FileText, ShieldCheck, FileWarning, Clock } from 'lucide-react';
import { sampleUserDocuments, sampleDocumentTypes, sampleUserHabilitationStatus, getUserHabilitationStatusInfo, getUserDocumentStatusColor, getAuctionStatusText } from '@/lib/sample-data';
import type { UserDocument, DocumentType, UserHabilitationStatus, UserDocumentStatus } from '@/types';

export default function UserDocumentsPage() {
  // Simula o ID do usuário logado
  const currentUserId = 'user123'; 

  // Filtra os documentos do usuário atual e popula com o DocumentType
  const userDocuments = sampleUserDocuments
    .filter(ud => ud.userId === currentUserId)
    .map(ud => ({
      ...ud,
      documentType: sampleDocumentTypes.find(dt => dt.id === ud.documentTypeId)
    }));

  // Identifica quais tipos de documentos obrigatórios ainda não foram enviados ou foram rejeitados
  const requiredDocumentTypesNotYetApproved = sampleDocumentTypes.filter(dt => {
    if (!dt.isRequired) return false;
    const userDoc = userDocuments.find(ud => ud.documentTypeId === dt.id);
    return !userDoc || userDoc.status === 'NOT_SENT' || userDoc.status === 'REJECTED';
  });

  // Adiciona placeholders para documentos obrigatórios não enviados
  const allDisplayDocuments: (UserDocument & { documentType: DocumentType })[] = [
    ...userDocuments.filter(ud => ud.documentType) as (UserDocument & { documentType: DocumentType })[],
    ...requiredDocumentTypesNotYetApproved
      .filter(dt => !userDocuments.some(ud => ud.documentTypeId === dt.id)) // Evita duplicados se já estiverem na lista de userDocuments (ex: rejeitados)
      .map(dt => ({
        id: `placeholder-${dt.id}`,
        documentTypeId: dt.id,
        userId: currentUserId,
        status: 'NOT_SENT' as UserDocumentStatus,
        documentType: dt
      }))
  ];

  // Ordena para que os obrigatórios e não enviados/rejeitados apareçam primeiro
  allDisplayDocuments.sort((a, b) => {
    const aIsPending = a.status === 'NOT_SENT' || a.status === 'REJECTED';
    const bIsPending = b.status === 'NOT_SENT' || b.status === 'REJECTED';
    if (a.documentType.isRequired && !b.documentType.isRequired) return -1;
    if (!a.documentType.isRequired && b.documentType.isRequired) return 1;
    if (aIsPending && !bIsPending) return -1;
    if (!aIsPending && bIsPending) return 1;
    return 0;
  });


  const habilitationStatusInfo = getUserHabilitationStatusInfo(sampleUserHabilitationStatus);

  const getStatusIcon = (status: UserDocumentStatus) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'REJECTED':
        return <FileWarning className="h-5 w-5 text-red-600" />;
      case 'PENDING_ANALYSIS':
      case 'SUBMITTED':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'NOT_SENT':
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <ShieldCheck className="h-7 w-7 mr-3 text-primary" />
            Meus Documentos e Habilitação
          </CardTitle>
          <CardDescription>
            Gerencie seus documentos para se habilitar a participar dos leilões.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card className="bg-secondary/30">
            <CardHeader>
              <CardTitle className="text-lg">Status da Sua Habilitação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-2">
                <div className={`p-2 rounded-full ${habilitationStatusInfo.color} text-white`}>
                  {habilitationStatusInfo.progress === 100 ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <p className="text-xl font-semibold">{habilitationStatusInfo.text}</p>
                  {sampleUserHabilitationStatus === 'REJECTED_DOCUMENTS' && (
                     <p className="text-sm text-red-600">Verifique os documentos abaixo e reenvie os necessários.</p>
                  )}
                </div>
              </div>
              <Progress value={habilitationStatusInfo.progress} className="w-full h-3" />
              <p className="text-xs text-muted-foreground mt-1 text-right">{habilitationStatusInfo.progress}% completo</p>
            </CardContent>
          </Card>

          <Separator />

          <div>
            <h3 className="text-xl font-semibold mb-1">Documentos Necessários</h3>
            <p className="text-sm text-muted-foreground mb-4">Envie os documentos abaixo para análise. Formatados aceitos: PDF, JPG, PNG (Máx. 5MB).</p>
            <div className="space-y-4">
              {allDisplayDocuments.map((doc) => (
                <Card key={doc.id} className={`border-l-4 ${getUserDocumentStatusColor(doc.status).split(' ')[2] /* Get border color class */}`}>
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] items-center gap-4">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(doc.status)}
                      <div>
                        <h4 className="font-semibold">{doc.documentType.name} {doc.documentType.isRequired && <span className="text-red-500">*</span>}</h4>
                        <p className="text-xs text-muted-foreground">{doc.documentType.description}</p>
                        {doc.status === 'REJECTED' && doc.rejectionReason && (
                          <Alert variant="destructive" className="mt-2 text-xs p-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="font-semibold">Motivo da Rejeição:</AlertTitle>
                            <AlertDescription>{doc.rejectionReason}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={`py-1 px-3 text-xs ${getUserDocumentStatusColor(doc.status)}`}>
                      {getAuctionStatusText(doc.status)}
                    </Badge>
                    <div className="flex flex-col sm:flex-row gap-2 justify-end">
                      {doc.status === 'APPROVED' && doc.fileUrl && (
                        <Button variant="outline" size="sm" onClick={() => alert('Visualizar documento (placeholder)')}>
                          <Eye className="mr-2 h-4 w-4" /> Ver Enviado
                        </Button>
                      )}
                      {(doc.status === 'NOT_SENT' || doc.status === 'REJECTED') && (
                        <Button size="sm" onClick={() => alert('Abrir modal de upload (placeholder)')}>
                          <UploadCloud className="mr-2 h-4 w-4" /> 
                          {doc.status === 'REJECTED' ? 'Reenviar' : 'Enviar Documento'}
                        </Button>
                      )}
                       {(doc.status === 'PENDING_ANALYSIS' || doc.status === 'SUBMITTED') && doc.fileUrl && (
                        <Button variant="outline" size="sm" disabled>
                          <Clock className="mr-2 h-4 w-4" /> Em Análise
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-xl font-semibold mb-4">Documentos Gerados</h3>
            <Card className="bg-secondary/30">
                <CardContent className="p-6 text-center text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 text-gray-400"/>
                    <p>Nenhum documento gerado automaticamente ainda.</p>
                    <p className="text-xs">Autos de arrematação e outros documentos aparecerão aqui após a conclusão dos leilões.</p>
                </CardContent>
            </Card>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

    