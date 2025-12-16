/**
 * @fileoverview Serviço de Integração FIPE
 * @description Integração com API FIPE para avaliação de veículos
 * @module services/fipe.service
 */

import { prisma } from '@/lib/prisma';

// =============================================================================
// TYPES
// =============================================================================

export interface FipeBrand {
  codigo: string;
  nome: string;
}

export interface FipeModel {
  codigo: string;
  nome: string;
}

export interface FipeYear {
  codigo: string;
  nome: string;
}

export interface FipePrice {
  Valor: string;
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
  TipoVeiculo: number;
  SiglaCombustivel: string;
}

export interface FipeEvaluation {
  fipeCode: string;
  fipePrice: number;
  referenceMonth: string;
  brandName: string;
  modelName: string;
  year: number;
  fuelType: string;
  mileageAdjustment?: number;
  conditionAdjustment?: number;
  adjustedPrice?: number;
}

export interface FipeSearchParams {
  brandCode?: string;
  modelCode?: string;
  yearCode?: string;
  vehicleType?: 'carros' | 'motos' | 'caminhoes';
}

// =============================================================================
// CONSTANTS
// =============================================================================

// URL base da API FIPE (paralela.com.br é uma alternativa comum)
const FIPE_API_BASE = 'https://parallelum.com.br/fipe/api/v1';

// Cache TTL (30 dias em segundos)
const CACHE_TTL_DAYS = 30;

// Ajuste por quilometragem (depreciação por km acima da média)
const AVERAGE_KM_PER_YEAR = 15000;
const DEPRECIATION_PER_KM = 0.0001; // 0.01% por km acima da média

// Ajuste por condição
const CONDITION_ADJUSTMENTS: Record<string, number> = {
  BOM: 0,
  REGULAR: -0.05, // -5%
  RUIM: -0.15,    // -15%
  NAO_INFORMADO: -0.03, // -3% (conservador)
};

// =============================================================================
// HELPERS
// =============================================================================

const parseFipeValue = (value: string): number => {
  // Remove "R$ " e converte "." para "" e "," para "."
  const cleaned = value
    .replace(/R\$\s?/, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(cleaned) || 0;
};

const formatReferenceMonth = (mesReferencia: string): string => {
  // Converte "dezembro de 2024" para "2024-12"
  const months: Record<string, string> = {
    janeiro: '01', fevereiro: '02', março: '03', abril: '04',
    maio: '05', junho: '06', julho: '07', agosto: '08',
    setembro: '09', outubro: '10', novembro: '11', dezembro: '12',
  };
  
  const parts = mesReferencia.toLowerCase().split(' de ');
  if (parts.length === 2) {
    const monthNum = months[parts[0]] || '01';
    return `${parts[1]}-${monthNum}`;
  }
  
  // Fallback para data atual
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const calculateMileageAdjustment = (
  mileage: number,
  year: number,
  fipePrice: number
): number => {
  const vehicleAge = new Date().getFullYear() - year;
  const expectedMileage = vehicleAge * AVERAGE_KM_PER_YEAR;
  const excessMileage = mileage - expectedMileage;
  
  if (excessMileage <= 0) {
    // Km abaixo da média = pequena valorização
    return Math.abs(excessMileage) * DEPRECIATION_PER_KM * fipePrice * 0.5;
  }
  
  // Km acima da média = depreciação
  return -excessMileage * DEPRECIATION_PER_KM * fipePrice;
};

const calculateConditionAdjustment = (
  condition: string,
  fipePrice: number
): number => {
  const adjustmentPercent = CONDITION_ADJUSTMENTS[condition] || 0;
  return adjustmentPercent * fipePrice;
};

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class FipeService {
  /**
   * Busca todas as marcas de veículos
   */
  async getBrands(vehicleType: 'carros' | 'motos' | 'caminhoes' = 'carros'): Promise<FipeBrand[]> {
    try {
      const response = await fetch(`${FIPE_API_BASE}/${vehicleType}/marcas`);
      if (!response.ok) throw new Error('Erro ao buscar marcas FIPE');
      return await response.json();
    } catch (error) {
      console.error('FipeService.getBrands error:', error);
      return [];
    }
  }

  /**
   * Busca modelos de uma marca
   */
  async getModels(
    brandCode: string,
    vehicleType: 'carros' | 'motos' | 'caminhoes' = 'carros'
  ): Promise<FipeModel[]> {
    try {
      const response = await fetch(
        `${FIPE_API_BASE}/${vehicleType}/marcas/${brandCode}/modelos`
      );
      if (!response.ok) throw new Error('Erro ao buscar modelos FIPE');
      const data = await response.json();
      return data.modelos || [];
    } catch (error) {
      console.error('FipeService.getModels error:', error);
      return [];
    }
  }

  /**
   * Busca anos disponíveis para um modelo
   */
  async getYears(
    brandCode: string,
    modelCode: string,
    vehicleType: 'carros' | 'motos' | 'caminhoes' = 'carros'
  ): Promise<FipeYear[]> {
    try {
      const response = await fetch(
        `${FIPE_API_BASE}/${vehicleType}/marcas/${brandCode}/modelos/${modelCode}/anos`
      );
      if (!response.ok) throw new Error('Erro ao buscar anos FIPE');
      return await response.json();
    } catch (error) {
      console.error('FipeService.getYears error:', error);
      return [];
    }
  }

  /**
   * Busca preço FIPE para um veículo específico
   */
  async getPrice(
    brandCode: string,
    modelCode: string,
    yearCode: string,
    vehicleType: 'carros' | 'motos' | 'caminhoes' = 'carros'
  ): Promise<FipePrice | null> {
    try {
      const response = await fetch(
        `${FIPE_API_BASE}/${vehicleType}/marcas/${brandCode}/modelos/${modelCode}/anos/${yearCode}`
      );
      if (!response.ok) throw new Error('Erro ao buscar preço FIPE');
      return await response.json();
    } catch (error) {
      console.error('FipeService.getPrice error:', error);
      return null;
    }
  }

  /**
   * Busca preço FIPE do cache ou da API
   */
  async getCachedPrice(fipeCode: string): Promise<{
    fipePrice: number;
    referenceMonth: string;
  } | null> {
    try {
      // Tenta buscar do cache
      const cached = await prisma.vehicleFipePrice.findUnique({
        where: { fipeCode },
      });

      if (cached && cached.expiresAt > new Date()) {
        return {
          fipePrice: Number(cached.fipePrice),
          referenceMonth: cached.referenceMonth,
        };
      }

      // Cache expirado ou não existe - não temos como buscar sem os códigos
      return null;
    } catch (error) {
      console.error('FipeService.getCachedPrice error:', error);
      return null;
    }
  }

  /**
   * Salva preço FIPE no cache
   */
  async cachePrice(fipePrice: FipePrice): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

      await prisma.vehicleFipePrice.upsert({
        where: { fipeCode: fipePrice.CodigoFipe },
        update: {
          fipePrice: parseFipeValue(fipePrice.Valor),
          referenceMonth: formatReferenceMonth(fipePrice.MesReferencia),
          cachedAt: new Date(),
          expiresAt,
        },
        create: {
          fipeCode: fipePrice.CodigoFipe,
          brandName: fipePrice.Marca,
          modelName: fipePrice.Modelo,
          year: fipePrice.AnoModelo,
          fuelType: fipePrice.SiglaCombustivel,
          fipePrice: parseFipeValue(fipePrice.Valor),
          referenceMonth: formatReferenceMonth(fipePrice.MesReferencia),
          cachedAt: new Date(),
          expiresAt,
        },
      });
    } catch (error) {
      console.error('FipeService.cachePrice error:', error);
    }
  }

  /**
   * Avalia um veículo com base no preço FIPE
   * Inclui ajustes por quilometragem e condição
   */
  async evaluateVehicle(
    assetId: string,
    fipePrice: number,
    fipeCode: string,
    referenceMonth: string,
    mileage?: number,
    year?: number,
    condition?: string
  ): Promise<FipeEvaluation | null> {
    try {
      let mileageAdjustment = 0;
      let conditionAdjustment = 0;

      // Calcula ajuste por quilometragem
      if (mileage && year) {
        mileageAdjustment = calculateMileageAdjustment(mileage, year, fipePrice);
      }

      // Calcula ajuste por condição
      if (condition) {
        conditionAdjustment = calculateConditionAdjustment(condition, fipePrice);
      }

      // Preço ajustado final
      const adjustedPrice = fipePrice + mileageAdjustment + conditionAdjustment;

      // Salva avaliação no banco
      await prisma.assetFipeEvaluation.upsert({
        where: { assetId: BigInt(assetId) },
        update: {
          fipeCode,
          fipePrice,
          evaluationDate: new Date(),
          mileageAdjustment,
          conditionAdjustment,
          adjustedPrice,
        },
        create: {
          assetId: BigInt(assetId),
          fipeCode,
          fipePrice,
          evaluationDate: new Date(),
          mileageAdjustment,
          conditionAdjustment,
          adjustedPrice,
        },
      });

      return {
        fipeCode,
        fipePrice,
        referenceMonth,
        brandName: '',
        modelName: '',
        year: year || 0,
        fuelType: '',
        mileageAdjustment,
        conditionAdjustment,
        adjustedPrice,
      };
    } catch (error) {
      console.error('FipeService.evaluateVehicle error:', error);
      return null;
    }
  }

  /**
   * Busca avaliação FIPE existente para um asset
   */
  async getAssetEvaluation(assetId: string): Promise<FipeEvaluation | null> {
    try {
      const evaluation = await prisma.assetFipeEvaluation.findUnique({
        where: { assetId: BigInt(assetId) },
      });

      if (!evaluation) return null;

      // Busca dados adicionais do cache
      let additionalData = null;
      if (evaluation.fipeCode) {
        const cached = await prisma.vehicleFipePrice.findUnique({
          where: { fipeCode: evaluation.fipeCode },
        });
        additionalData = cached;
      }

      return {
        fipeCode: evaluation.fipeCode || '',
        fipePrice: Number(evaluation.fipePrice) || 0,
        referenceMonth: additionalData?.referenceMonth || '',
        brandName: additionalData?.brandName || '',
        modelName: additionalData?.modelName || '',
        year: additionalData?.year || 0,
        fuelType: additionalData?.fuelType || '',
        mileageAdjustment: Number(evaluation.mileageAdjustment) || undefined,
        conditionAdjustment: Number(evaluation.conditionAdjustment) || undefined,
        adjustedPrice: Number(evaluation.adjustedPrice) || undefined,
      };
    } catch (error) {
      console.error('FipeService.getAssetEvaluation error:', error);
      return null;
    }
  }

  /**
   * Busca marcas com cache em memória simples
   */
  private brandsCache: { data: FipeBrand[]; timestamp: number } | null = null;
  private readonly BRANDS_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 horas

  async getBrandsWithCache(
    vehicleType: 'carros' | 'motos' | 'caminhoes' = 'carros'
  ): Promise<FipeBrand[]> {
    const now = Date.now();
    
    if (this.brandsCache && (now - this.brandsCache.timestamp) < this.BRANDS_CACHE_TTL) {
      return this.brandsCache.data;
    }

    const brands = await this.getBrands(vehicleType);
    this.brandsCache = { data: brands, timestamp: now };
    return brands;
  }
}

// Singleton export
export const fipeService = new FipeService();
