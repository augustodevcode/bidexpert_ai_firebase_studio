// src/app/dashboard/documents/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, Loader2, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { getUserHabilitationStatusInfo } from '@/lib/sample-data-helpers';
import type { UserDocument, DocumentType } from '@/types';
import { getDocumentTypes, getUserDocuments, saveUserDocument } from './actions';
import { useToast } from '@/hooks/use-toast';
import DocumentUploadCard from '@/components/document-upload-card';

export default function UserDocumentsPage() {
  const { userProfileWithPermissions, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [allDocTypes, setAllDocTypes] = useState<DocumentType[]>([]);
  const [userDocs, setUserDocs] = useState<UserDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocumentData = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const [docTypes, existingDocs] = await Promise.all([
        getDocumentTypes(),
        getUserDocuments(userId),
      ]);
      setAllDocTypes(docTypes);
      setUserDocs(existingDocs);
    } catch (error) {
      console.error("Error fetching document data:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os dados dos documentos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    if (userProfileWithPermissions?.uid) {
      fetchDocumentData(userProfileWithPermissions.uid);
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [userProfileWithPermissions, authLoading, fetchDocumentData]);
  
  const handleFileUploadSuccess = async (docTypeId: string, fileUrl: string, fileName: string) => {
    if (!userProfileWithPermissions?.uid) return;
    const result = await saveUserDocument(userProfileWithPermissions.uid, docTypeId, fileUrl, fileName);
    if(result.success) {
        toast({ title: "Sucesso!", description: "Documento enviado para análise."});
        fetchDocumentData(userProfileWithPermissions.uid); // Refresh data
    } else {
        toast({ title: "Erro ao Salvar", description: result.message, variant: "destructive"});
    }
  };

  const relevantDocTypes = allDocTypes.filter(dt => {
      if (userProfileWithPermissions?.accountType === 'LEGAL' || userProfileWithPermissions?.accountType === 'DIRECT_SALE_CONSIGNOR') {
          return dt.appliesTo.includes('LEGAL');
      }
      return dt.appliesTo.includes('PHYSICAL');
  });

  const mergedDocuments = relevantDocTypes.map(docType => {
      const userDoc = userDocs.find(d => d.documentTypeId === docType.id);
      return {
          id: userDoc?.id || `placeholder-${docType.id}`,
          documentTypeId: docType.id,
          userId: userProfileWithPermissions?.uid || '',
          status: userDoc?.status || 'NOT_SENT',
          fileUrl: userDoc?.fileUrl,
          rejectionReason: userDoc?.rejectionReason,
          documentType: docType,
      };
  });
  
  const habilitationStatusInfo = getUserHabilitationStatusInfo(userProfileWithPermissions?.habilitationStatus);
  const HabilitationIcon = habilitationStatusInfo.icon;
  
  if (isLoading || authLoading) {
      return (
        <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Carregando seus documentos...</p>
        </div>
      );
  }

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
        <CardContent className="space-y-8">
          <div className="p-4 border rounded-lg bg-secondary/30">
             <CardTitle className="text-lg mb-2">Status da Sua Habilitação</CardTitle>
              <div className="space-y-1">
                <p className={`font-semibold text-lg ${habilitationStatusInfo.textColor}`}>{habilitationStatusInfo.text}</p>
                <p className="text-sm text-muted-foreground">{habilitationStatusInfo.description}</p>
              </div>
              <Progress value={habilitationStatusInfo.progress} className="w-full h-2 mt-3" />
              <p className="text-xs text-muted-foreground mt-1 text-right">{habilitationStatusInfo.progress}% completo</p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-1">Documentos Necessários</h3>
            <p className="text-sm text-muted-foreground mb-4">Envie os documentos abaixo para análise. Formatos aceitos: PDF, JPG, PNG (Máx. 5MB).</p>
            <div className="space-y-4">
              {mergedDocuments.map((doc) => (
                <DocumentUploadCard 
                    key={doc.documentTypeId}
                    title={`${doc.documentType.name} ${doc.documentType.isRequired ? '*' : ''}`}
                    description={doc.documentType.description}
                    status={doc.status}
                    rejectionReason={doc.rejectionReason}
                    fileUrl={doc.fileUrl}
                    onFileUpload={(file) => handleFileUploadSuccess(doc.documentTypeId, file.url, file.name)}
                />
              ))}
            </div>
          </div>
          
          <Separator />

           <div>
            <h3 className="text-xl font-semibold mb-2">Documentos Gerados</h3>
            <div className="text-center py-10 bg-muted/50 rounded-lg">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum documento gerado automaticamente ainda.</p>
                <p className="text-xs text-muted-foreground mt-1">Autos de arrematação e outros documentos aparecerão aqui após a conclusão dos leilões.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
