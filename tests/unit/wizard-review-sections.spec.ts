/**
 * @fileoverview Testa a montagem das seções de revisão final do wizard.
 */

import { describe, expect, it } from 'vitest';

import { buildWizardReviewSections } from '@/components/admin/wizard/wizard-review-sections';

describe('buildWizardReviewSections', () => {
  it('monta contato, documentos e opções de lance com valores preenchidos', () => {
    const sections = buildWizardReviewSections({
      supportPhone: '(11) 4000-1000',
      supportEmail: 'suporte@bidexpert.com.br',
      supportWhatsApp: '(11) 98888-7777',
      documentsUrl: 'https://docs.bidexpert.com.br/edital.pdf',
      evaluationReportUrl: 'https://docs.bidexpert.com.br/laudo.pdf',
      auctionCertificateUrl: 'https://docs.bidexpert.com.br/matricula.pdf',
      sellingBranch: 'Central de Venda Direta São Paulo',
      allowInstallmentBids: true,
      allowMultipleBidsPerUser: true,
      silentBiddingEnabled: false,
      automaticBiddingEnabled: true,
      softCloseEnabled: true,
      softCloseMinutes: 5,
    });

    expect(sections.support).toEqual([
      { label: 'Telefone de suporte', value: '(11) 4000-1000' },
      { label: 'Email de suporte', value: 'suporte@bidexpert.com.br' },
      { label: 'WhatsApp', value: '(11) 98888-7777' },
    ]);

    expect(sections.documents).toEqual([
      { label: 'Documentos do leilão', value: 'https://docs.bidexpert.com.br/edital.pdf' },
      { label: 'Laudo de avaliação', value: 'https://docs.bidexpert.com.br/laudo.pdf' },
      { label: 'Certidão/Matrícula', value: 'https://docs.bidexpert.com.br/matricula.pdf' },
      { label: 'Vara/Filial de venda', value: 'Central de Venda Direta São Paulo' },
    ]);

    expect(sections.bidding).toEqual([
      { label: 'Lances parcelados', value: 'Permitido' },
      { label: 'Múltiplos lances por usuário', value: 'Permitido' },
      { label: 'Lances sigilosos', value: 'Desativado' },
      { label: 'Lance automático', value: 'Ativado' },
      { label: 'Soft close', value: 'Ativado' },
      { label: 'Janela de soft close', value: '5 minuto(s)' },
    ]);
  });

  it('usa fallbacks descritivos quando os campos não foram preenchidos', () => {
    const sections = buildWizardReviewSections({
      allowInstallmentBids: false,
      allowMultipleBidsPerUser: false,
      silentBiddingEnabled: false,
      automaticBiddingEnabled: false,
      softCloseEnabled: false,
    });

    expect(sections.support.every((item) => item.value === 'Não informado')).toBe(true);
    expect(sections.documents.every((item) => item.value === 'Não informado')).toBe(true);
    expect(sections.bidding).toEqual([
      { label: 'Lances parcelados', value: 'Desativado' },
      { label: 'Múltiplos lances por usuário', value: 'Desativado' },
      { label: 'Lances sigilosos', value: 'Desativado' },
      { label: 'Lance automático', value: 'Desativado' },
      { label: 'Soft close', value: 'Desativado' },
      { label: 'Janela de soft close', value: 'Não aplicável' },
    ]);
  });
});