// src/components/dashboard/bidder/documents-section.tsx
/**
 * @fileoverview Seção de documentos no dashboard do bidder
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Upload,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Plus
} from 'lucide-react';

interface DocumentsSectionProps {}

export function DocumentsSection({}: DocumentsSectionProps) {
  const [documentStatus, setDocumentStatus] = useState('PENDING');
  const [submittedDocuments, setSubmittedDocuments] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState('');

  // Documentos obrigatórios para arrematantes
  const requiredDocuments = [
    { type: 'CPF', name: 'CPF', description: 'Documento de identificação pessoal' },
    { type: 'RG', name: 'RG ou CNH', description: 'Documento de identificação com foto' },
    { type: 'PROOF_OF_ADDRESS', name: 'Comprovante de Endereço', description: 'Conta de luz, água ou telefone' },
    { type: 'PROOF_OF_INCOME', name: 'Comprovante de Renda', description: 'Últimos 3 contracheques ou declaração' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'UNDER_REVIEW':
        return <Eye className="h-4 w-4" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline">Pendente</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="secondary">Em Análise</Badge>;
      case 'APPROVED':
        return <Badge variant="default">Aprovado</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-orange-500';
      case 'UNDER_REVIEW':
        return 'bg-blue-500';
      case 'APPROVED':
        return 'bg-green-500';
      case 'REJECTED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const calculateProgress = () => {
    const total = requiredDocuments.length;
    const approved = submittedDocuments.filter(doc => doc.status === 'APPROVED').length;
    return total > 0 ? (approved / total) * 100 : 0;
  };

  const handleUploadDocument = (documentType: string) => {
    setSelectedDocumentType(documentType);
    setShowUpload(true);
  };

  const handleDownloadTemplate = (documentType: string) => {
    // TODO: Implementar download de template
    console.log('Download template for:', documentType);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Meus Documentos
          </CardTitle>
          <CardDescription>
            Gerencie os documentos necessários para participar dos leilões
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Overview */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso da Documentação</span>
              <span className="text-sm text-muted-foreground">
                {submittedDocuments.filter(doc => doc.status === 'APPROVED').length} de {requiredDocuments.length} documentos
              </span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(documentStatus)}`} />
              <span className="text-sm text-muted-foreground">
                Status geral: {getStatusBadge(documentStatus)}
              </span>
            </div>
          </div>

          {/* Required Documents */}
          <div className="space-y-4">
            <h4 className="font-medium">Documentos Obrigatórios</h4>

            {requiredDocuments.map((doc) => {
              const submittedDoc = submittedDocuments.find(d => d.type === doc.type);

              return (
                <div key={doc.type} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{doc.name}</div>
                    <div className="text-sm text-muted-foreground">{doc.description}</div>
                    {submittedDoc && (
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusIcon(submittedDoc.status)}
                        {getStatusBadge(submittedDoc.status)}
                        <span className="text-xs text-muted-foreground">
                          Enviado em {submittedDoc.createdAt.toLocaleDateString('pt-BR')}
                        </span>
                        {submittedDoc.rejectionReason && (
                          <span className="text-xs text-destructive">
                            • {submittedDoc.rejectionReason}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {submittedDoc ? (
                      <>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                        {submittedDoc.status === 'REJECTED' && (
                          <Button
                            size="sm"
                            onClick={() => handleUploadDocument(doc.type)}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Reenviar
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadTemplate(doc.type)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Template
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUploadDocument(doc.type)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Enviar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Document Status Information */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Sobre a Análise de Documentos</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Documentos são analisados em até 24 horas úteis</li>
              <li>• Apenas documentos nítidos e legíveis são aceitos</li>
              <li>• Certifique-se de que todos os dados estão corretos</li>
              <li>• Documentos rejeitados podem ser reenviados quantas vezes necessário</li>
            </ul>
          </div>

          {/* Help Section */}
          <div className="mt-6 p-4 border border-dashed rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">Precisa de Ajuda?</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Não sabe quais documentos enviar ou como prepará-los?
            </p>
            <Button variant="outline" size="sm">
              Ver Guia Completo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Document Modal */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Documento</DialogTitle>
            <DialogDescription>
              Faça o upload do documento necessário
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center p-6 border-2 border-dashed rounded-lg">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Arraste o arquivo aqui ou clique para selecionar
              </p>
              <Button variant="outline" size="sm">
                Selecionar Arquivo
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Documento</label>
              <div className="p-2 bg-muted rounded text-sm">
                {requiredDocuments.find(doc => doc.type === selectedDocumentType)?.name}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Observações (opcional)</label>
              <textarea
                className="w-full p-2 border rounded-md resize-none"
                rows={3}
                placeholder="Adicione observações sobre o documento..."
              />
            </div>

            <div className="text-xs text-muted-foreground">
              <p>• Formatos aceitos: PDF, JPG, PNG</p>
              <p>• Tamanho máximo: 10MB</p>
              <p>• Documento deve estar nítido e legível</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowUpload(false)}>
              Cancelar
            </Button>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Enviar Documento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
