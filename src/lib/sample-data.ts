// src/lib/sample-data.ts
// This file now contains only client-safe helper functions.
// Server-side data loading has been moved to the SampleDataAdapter.
'use client';

import type { LotStatus, DirectSaleOfferStatus, AuctionStatus, UserDocumentStatus, UserHabilitationStatus, PaymentStatus } from '@/types';
import { FileText, Clock, FileWarning, CheckCircle2, ShieldAlert, HelpCircle } from 'lucide-react';
import type { LotCategory } from '@/types';

// ============================================================================
// CLIENT-SAFE HELPER FUNCTIONS
// ============================================================================

export const getAuctionStatusText = (status: AuctionStatus | LotStatus | UserDocumentStatus | UserHabilitationStatus | PaymentStatus | DirectSaleOfferStatus ): string => {
  switch (status) {
    case 'ABERTO_PARA_LANCES': return 'Aberto para Lances';
    case 'EM_BREVE': return 'Em Breve';
    case 'ENCERRADO': return 'Encerrado';
    case 'FINALIZADO': return 'Finalizado';
    case 'ABERTO': return 'Aberto';
    case 'CANCELADO': return 'Cancelado';
    case 'SUSPENSO': return 'Suspenso';
    case 'VENDIDO': return 'Vendido';
    case 'NAO_VENDIDO': return 'Não Vendido';
    case 'NOT_SENT': return 'Não Enviado';
    case 'SUBMITTED': return 'Enviado';
    case 'APPROVED': return 'Aprovado';
    case 'REJECTED': return 'Rejeitado';
    case 'PENDING_ANALYSIS': return 'Em Análise';
    case 'PENDING_DOCUMENTS': return 'Documentação Pendente';
    case 'HABILITADO': return 'Habilitado para Dar Lances'; 
    case 'REJECTED_DOCUMENTS': return 'Documentos Rejeitados';
    case 'BLOCKED': return 'Conta Bloqueada';
    case 'ACTIVE': return 'Ativa'; 
    case 'SOLD': return 'Vendido'; 
    case 'EXPIRED': return 'Expirada'; 
    case 'PENDING_APPROVAL': return 'Pendente Aprovação';
    case 'RASCUNHO': return 'Rascunho';
    case 'EM_PREPARACAO': return 'Em Preparação';
    case 'PENDENTE': return 'Pendente';
    case 'PROCESSANDO': return 'Processando';
    case 'PAGO': return 'Pago';
    case 'FALHOU': return 'Falhou';
    case 'REEMBOLSADO': return 'Reembolsado';
    default: {
      if (typeof status === 'string') {
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      return 'Status Desconhecido';
    }
  }
};

export const getLotStatusColor = (status: LotStatus | DirectSaleOfferStatus): string => {
  switch (status) {
    case 'ABERTO_PARA_LANCES':
    case 'ACTIVE': 
      return 'bg-green-600 text-white';
    case 'EM_BREVE':
    case 'PENDING_APPROVAL': 
      return 'bg-blue-500 text-white';
    case 'ENCERRADO':
    case 'VENDIDO':
    case 'NAO_VENDIDO':
    case 'SOLD': 
    case 'EXPIRED': 
      return 'bg-gray-500 text-white';
    default:
      return 'bg-gray-300 text-gray-800';
  }
};

export const getPaymentStatusText = (status: PaymentStatus): string => getAuctionStatusText(status);

export const getUserDocumentStatusColor = (status: UserDocumentStatus): string => {
  switch (status) {
    case 'APPROVED': return 'border-green-500 text-green-700 bg-green-50';
    case 'REJECTED': return 'border-red-500 text-red-700 bg-red-50';
    case 'PENDING_ANALYSIS':
    case 'SUBMITTED':
      return 'border-yellow-500 text-yellow-700 bg-yellow-50';
    case 'NOT_SENT':
    default:
      return 'border-gray-400 text-gray-600 bg-gray-50';
  }
};

export const getUserHabilitationStatusInfo = (status: UserHabilitationStatus) => {
  switch (status) {
    case 'HABILITADO':
      return { text: 'Habilitado', color: 'bg-green-600', icon: CheckCircle2, progress: 100 };
    case 'PENDING_ANALYSIS':
      return { text: 'Em Análise', color: 'bg-yellow-500', icon: Clock, progress: 75 };
    case 'PENDING_DOCUMENTS':
      return { text: 'Documentos Pendentes', color: 'bg-orange-500', icon: FileWarning, progress: 25 };
    case 'REJECTED_DOCUMENTS':
      return { text: 'Documentos Rejeitados', color: 'bg-red-600', icon: FileWarning, progress: 50 };
    case 'BLOCKED':
      return { text: 'Conta Bloqueada', color: 'bg-gray-700', icon: ShieldAlert, progress: 0 };
    default:
      return { text: 'Status Desconhecido', color: 'bg-gray-400', icon: HelpCircle, progress: 0 };
  }
};

export const getCategoryAssets = (categoryName: string): { bannerUrl: string, bannerAiHint: string } => {
  const assets: Record<string, { bannerUrl: string, bannerAiHint: string }> = {
      'Leilões Judiciais': { bannerUrl: 'https://placehold.co/1200x250.png?text=Leiloes+Judiciais', bannerAiHint: 'tribunal martelo' },
      'Leilões Extrajudiciais': { bannerUrl: 'https://placehold.co/1200x250.png?text=Leiloes+Extrajudiciais', bannerAiHint: 'contrato assinatura' },
      'Tomada de Preços': { bannerUrl: 'https://placehold.co/1200x250.png?text=Tomada+de+Precos', bannerAiHint: 'documentos negocios' },
      'Venda Direta': { bannerUrl: 'https://placehold.co/1200x250.png?text=Venda+Direta', bannerAiHint: 'carrinho compras' },
      'Segunda Praça': { bannerUrl: 'https://placehold.co/1200x250.png?text=Segunda+Praca', bannerAiHint: 'desconto oportunidade' },
      'Leilões Encerrados': { bannerUrl: 'https://placehold.co/1200x250.png?text=Leiloes+Encerrados', bannerAiHint: 'arquivo historico' },
      'Leilões Cancelados': { bannerUrl: 'https://placehold.co/1200x250.png?text=Leiloes+Cancelados', bannerAiHint: 'carimbo cancelado' },
      'Default': { bannerUrl: 'https://placehold.co/1200x250.png?text=Leiloes', bannerAiHint: 'leilao geral' }
  };
  return assets[categoryName] || assets['Default'];
};
