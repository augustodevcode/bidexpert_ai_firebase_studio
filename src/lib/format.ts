// src/lib/format.ts
/**
 * @fileoverview Funções utilitárias para formatação de valores.
 * Inclui formatação de moeda, números e datas.
 */

/**
 * Formata um valor numérico como moeda brasileira (BRL)
 * @param value - O valor a ser formatado
 * @returns String formatada em BRL (ex: R$ 1.234,56)
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata um número com separadores de milhar
 * @param value - O valor a ser formatado
 * @returns String formatada (ex: 1.234.567)
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '0';
  }
  
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Formata um número como porcentagem
 * @param value - O valor a ser formatado (ex: 0.25 para 25%)
 * @param decimals - Número de casas decimais
 * @returns String formatada (ex: 25,00%)
 */
export function formatPercent(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) {
    return '0%';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Formata um número de forma compacta (ex: 1K, 1M)
 * @param value - O valor a ser formatado
 * @returns String formatada de forma compacta
 */
export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '0';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

/**
 * Formata um valor de bytes para formato legível (KB, MB, GB)
 * @param bytes - Valor em bytes
 * @returns String formatada (ex: 1,5 MB)
 */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Formata um CPF
 * @param cpf - CPF sem formatação
 * @returns CPF formatado (ex: 123.456.789-00)
 */
export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return '';
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata um CNPJ
 * @param cnpj - CNPJ sem formatação
 * @returns CNPJ formatado (ex: 12.345.678/0001-00)
 */
export function formatCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return '';
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata um telefone
 * @param phone - Telefone sem formatação
 * @returns Telefone formatado (ex: (11) 99999-9999)
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

/**
 * Formata um CEP
 * @param cep - CEP sem formatação
 * @returns CEP formatado (ex: 12345-678)
 */
export function formatCEP(cep: string | null | undefined): string {
  if (!cep) return '';
  const cleaned = cep.replace(/\D/g, '');
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}
