/**
 * @file src/app/api/lots/[lotId]/cost-simulation/route.ts
 * @description API route para simulação de custos de aquisição de lotes.
 * Calcula ITBI, taxas cartoriais, honorários e outros custos por categoria.
 * 
 * Gap 1.2 - Simulador de Custos para Imóveis
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ============================================================================
// Types
// ============================================================================

interface CostSimulationRequest {
  purchasePrice: number;
  financingPercentage?: number;
  propertyType?: "residential" | "commercial" | "rural" | "industrial";
}

interface CostBreakdown {
  category: string;
  name: string;
  value: number;
  percentage?: number;
  isRequired: boolean;
  notes?: string;
}

interface CostSimulationResponse {
  lotId: string;
  purchasePrice: number;
  costs: CostBreakdown[];
  totalCosts: number;
  totalWithPurchase: number;
  effectiveRate: number;
  disclaimer: string;
}

// ============================================================================
// Cost Configuration by Category
// ============================================================================

const COST_CONFIG = {
  property: {
    itbi: { percentage: 3, name: "ITBI", isRequired: true, notes: "Imposto sobre Transmissão de Bens Imóveis" },
    registry: { percentage: 1, name: "Registro de Imóveis", isRequired: true, notes: "Taxa de registro no cartório" },
    notary: { percentage: 0.5, name: "Escritura Pública", isRequired: true, notes: "Lavrar escritura em cartório" },
    successFee: { percentage: 5, name: "Honorários de Sucesso", isRequired: false, notes: "Comissão do leiloeiro" },
    lawyerFee: { percentage: 2, name: "Honorários Advocatícios", isRequired: false, notes: "Advogado para análise jurídica" },
    appraisal: { fixed: 1500, name: "Laudo de Avaliação", isRequired: false, notes: "Avaliação técnica do imóvel" },
    documentation: { fixed: 800, name: "Análise Documental", isRequired: true, notes: "Certidões e documentação" },
  },
  vehicle: {
    transferFee: { fixed: 262.57, name: "Taxa de Transferência", isRequired: true, notes: "Taxa do DETRAN" },
    plateChange: { fixed: 196.29, name: "Troca de Placa", isRequired: false, notes: "Se necessário" },
    ipva: { percentage: 4, name: "IPVA Proporcional", isRequired: true, notes: "Pode variar por estado" },
    successFee: { percentage: 5, name: "Honorários de Sucesso", isRequired: false, notes: "Comissão do leiloeiro" },
    insurance: { percentage: 3, name: "Seguro Obrigatório", isRequired: false, notes: "Estimativa anual" },
  },
  electronics: {
    successFee: { percentage: 5, name: "Honorários de Sucesso", isRequired: false, notes: "Comissão do leiloeiro" },
    shipping: { fixed: 150, name: "Frete", isRequired: false, notes: "Estimativa para envio" },
    warranty: { percentage: 10, name: "Garantia Estendida", isRequired: false, notes: "Opcional" },
  },
  machinery: {
    transport: { percentage: 2, name: "Transporte Especializado", isRequired: true, notes: "Caminhão/guincho" },
    successFee: { percentage: 5, name: "Honorários de Sucesso", isRequired: false, notes: "Comissão do leiloeiro" },
    inspection: { fixed: 2500, name: "Inspeção Técnica", isRequired: false, notes: "Laudo de mecânico" },
    certification: { fixed: 1500, name: "Recertificação", isRequired: false, notes: "Se necessário" },
  },
  livestock: {
    transport: { percentage: 1.5, name: "Transporte Animal", isRequired: true, notes: "Boiadeiro/caminhão" },
    successFee: { percentage: 5, name: "Honorários de Sucesso", isRequired: false, notes: "Comissão do leiloeiro" },
    veterinary: { fixed: 500, name: "Exame Veterinário", isRequired: true, notes: "GTA e sanidade" },
    quarantine: { fixed: 1000, name: "Quarentena", isRequired: false, notes: "Se aplicável" },
  },
  default: {
    successFee: { percentage: 5, name: "Honorários de Sucesso", isRequired: false, notes: "Comissão do leiloeiro" },
    logistics: { fixed: 200, name: "Logística", isRequired: false, notes: "Estimativa geral" },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function determineCategoryType(categoryName: string): keyof typeof COST_CONFIG {
  const normalized = categoryName.toLowerCase();
  if (normalized.includes("imóv") || normalized.includes("imov") || normalized.includes("casa") || normalized.includes("apartamento") || normalized.includes("terreno")) {
    return "property";
  }
  if (normalized.includes("veículo") || normalized.includes("veiculo") || normalized.includes("carro") || normalized.includes("moto")) {
    return "vehicle";
  }
  if (normalized.includes("eletrônico") || normalized.includes("eletronico") || normalized.includes("celular") || normalized.includes("notebook")) {
    return "electronics";
  }
  if (normalized.includes("máquina") || normalized.includes("maquina") || normalized.includes("equipamento") || normalized.includes("trator")) {
    return "machinery";
  }
  if (normalized.includes("semovente") || normalized.includes("gado") || normalized.includes("cavalo") || normalized.includes("bovino")) {
    return "livestock";
  }
  return "default";
}

function calculateCosts(
  purchasePrice: number,
  categoryType: keyof typeof COST_CONFIG
): CostBreakdown[] {
  const config = COST_CONFIG[categoryType];
  const costs: CostBreakdown[] = [];

  for (const [, item] of Object.entries(config)) {
    const costItem = item as { percentage?: number; fixed?: number; name: string; isRequired: boolean; notes?: string };
    let value = 0;

    if (costItem.percentage) {
      value = (purchasePrice * costItem.percentage) / 100;
    } else if (costItem.fixed) {
      value = costItem.fixed;
    }

    costs.push({
      category: categoryType,
      name: costItem.name,
      value: Math.round(value * 100) / 100,
      percentage: costItem.percentage,
      isRequired: costItem.isRequired,
      notes: costItem.notes,
    });
  }

  return costs;
}

// ============================================================================
// API Route Handler
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { lotId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { lotId } = params;
    const body: CostSimulationRequest = await request.json();

    if (!body.purchasePrice || body.purchasePrice <= 0) {
      return NextResponse.json(
        { error: "Preço de compra inválido" },
        { status: 400 }
      );
    }

    // Fetch lot with category
    const lot = await prisma.lot.findUnique({
      where: { id: BigInt(lotId) },
      include: {
        auction: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lote não encontrado" }, { status: 404 });
    }

    // Determine category type
    const categoryName = lot.auction?.category?.name || "default";
    const categoryType = determineCategoryType(categoryName);

    // Calculate costs
    const costs = calculateCosts(body.purchasePrice, categoryType);
    const totalCosts = costs.reduce((sum, c) => sum + c.value, 0);
    const totalWithPurchase = body.purchasePrice + totalCosts;
    const effectiveRate = (totalCosts / body.purchasePrice) * 100;

    const response: CostSimulationResponse = {
      lotId,
      purchasePrice: body.purchasePrice,
      costs,
      totalCosts: Math.round(totalCosts * 100) / 100,
      totalWithPurchase: Math.round(totalWithPurchase * 100) / 100,
      effectiveRate: Math.round(effectiveRate * 100) / 100,
      disclaimer:
        "Valores estimados para fins de planejamento. Custos reais podem variar conforme legislação local, cartório e condições específicas do lote.",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro na simulação de custos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { lotId: string } }
) {
  try {
    const { lotId } = params;
    const { searchParams } = new URL(request.url);
    const purchasePrice = parseFloat(searchParams.get("price") || "0");

    if (!purchasePrice || purchasePrice <= 0) {
      return NextResponse.json(
        { error: "Parâmetro 'price' é obrigatório" },
        { status: 400 }
      );
    }

    // Fetch lot
    const lot = await prisma.lot.findUnique({
      where: { id: BigInt(lotId) },
      include: {
        auction: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!lot) {
      return NextResponse.json({ error: "Lote não encontrado" }, { status: 404 });
    }

    const categoryName = lot.auction?.category?.name || "default";
    const categoryType = determineCategoryType(categoryName);
    const costs = calculateCosts(purchasePrice, categoryType);
    const totalCosts = costs.reduce((sum, c) => sum + c.value, 0);

    return NextResponse.json({
      lotId,
      purchasePrice,
      costs,
      totalCosts: Math.round(totalCosts * 100) / 100,
      totalWithPurchase: Math.round((purchasePrice + totalCosts) * 100) / 100,
      effectiveRate: Math.round(((totalCosts / purchasePrice) * 100) * 100) / 100,
    });
  } catch (error) {
    console.error("Erro ao obter simulação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
