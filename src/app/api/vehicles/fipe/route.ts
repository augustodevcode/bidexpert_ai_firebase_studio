/**
 * @file src/app/api/vehicles/fipe/route.ts
 * @description API route para integração com tabela FIPE.
 * Busca marcas, modelos, anos e preços da API FIPE.
 * 
 * Gap 2.2 - Integração com Tabela FIPE
 */

import { NextRequest, NextResponse } from "next/server";

// ============================================================================
// Types
// ============================================================================

interface FipePrice {
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

// ============================================================================
// FIPE API Configuration
// ============================================================================

const FIPE_BASE_URL = "https://parallelum.com.br/fipe/api/v1";

const VEHICLE_TYPES = {
  carros: "carros",
  motos: "motos",
  caminhoes: "caminhoes",
} as const;

type VehicleType = keyof typeof VEHICLE_TYPES;

// ============================================================================
// API Route Handlers
// ============================================================================

/**
 * GET /api/vehicles/fipe
 * Query params:
 * - type: "carros" | "motos" | "caminhoes"
 * - action: "brands" | "models" | "years" | "price"
 * - brandCode: string (required for models, years, price)
 * - modelCode: string (required for years, price)
 * - yearCode: string (required for price)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleType = (searchParams.get("type") || "carros") as VehicleType;
    const action = searchParams.get("action") || "brands";
    const brandCode = searchParams.get("brandCode");
    const modelCode = searchParams.get("modelCode");
    const yearCode = searchParams.get("yearCode");

    if (!VEHICLE_TYPES[vehicleType]) {
      return NextResponse.json(
        { error: "Tipo de veículo inválido. Use: carros, motos ou caminhoes" },
        { status: 400 }
      );
    }

    let url = `${FIPE_BASE_URL}/${vehicleType}`;

    switch (action) {
      case "brands":
        url += "/marcas";
        break;

      case "models":
        if (!brandCode) {
          return NextResponse.json(
            { error: "brandCode é obrigatório para buscar modelos" },
            { status: 400 }
          );
        }
        url += `/marcas/${brandCode}/modelos`;
        break;

      case "years":
        if (!brandCode || !modelCode) {
          return NextResponse.json(
            { error: "brandCode e modelCode são obrigatórios para buscar anos" },
            { status: 400 }
          );
        }
        url += `/marcas/${brandCode}/modelos/${modelCode}/anos`;
        break;

      case "price":
        if (!brandCode || !modelCode || !yearCode) {
          return NextResponse.json(
            { error: "brandCode, modelCode e yearCode são obrigatórios para buscar preço" },
            { status: 400 }
          );
        }
        url += `/marcas/${brandCode}/modelos/${modelCode}/anos/${yearCode}`;
        break;

      default:
        return NextResponse.json(
          { error: "Ação inválida. Use: brands, models, years ou price" },
          { status: 400 }
        );
    }

    // Make request to FIPE API
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      console.error(`FIPE API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: "Erro ao consultar tabela FIPE" },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Format response based on action
    if (action === "models") {
      // Models endpoint returns { modelos: [], anos: [] }
      return NextResponse.json({
        models: data.modelos || [],
        years: data.anos || [],
      });
    }

    if (action === "price") {
      // Parse price value to number
      const priceData = data as FipePrice;
      const priceString = priceData.Valor.replace("R$ ", "").replace(".", "").replace(",", ".");
      const priceNumber = parseFloat(priceString);

      return NextResponse.json({
        ...priceData,
        valorNumerico: priceNumber,
        consultadoEm: new Date().toISOString(),
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro na API FIPE:", error);
    return NextResponse.json(
      { error: "Erro interno ao consultar FIPE" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vehicles/fipe/compare
 * Body: { vehicleCode?: string, brandCode: string, modelCode: string, yearCode: string, lotPrice: number }
 * Returns comparison between lot price and FIPE price
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandCode, modelCode, yearCode, lotPrice, vehicleType = "carros" } = body;

    if (!brandCode || !modelCode || !yearCode) {
      return NextResponse.json(
        { error: "brandCode, modelCode e yearCode são obrigatórios" },
        { status: 400 }
      );
    }

    if (!lotPrice || lotPrice <= 0) {
      return NextResponse.json(
        { error: "lotPrice deve ser um valor positivo" },
        { status: 400 }
      );
    }

    // Fetch FIPE price
    const url = `${FIPE_BASE_URL}/${vehicleType}/marcas/${brandCode}/modelos/${modelCode}/anos/${yearCode}`;
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Veículo não encontrado na tabela FIPE" },
        { status: 404 }
      );
    }

    const fipeData: FipePrice = await response.json();
    const fipePriceString = fipeData.Valor.replace("R$ ", "").replace(".", "").replace(",", ".");
    const fipePrice = parseFloat(fipePriceString);

    // Calculate comparison metrics
    const difference = fipePrice - lotPrice;
    const percentageDiff = ((fipePrice - lotPrice) / fipePrice) * 100;
    const isGoodDeal = percentageDiff > 10;
    const isFairPrice = percentageDiff >= -5 && percentageDiff <= 10;
    const isOverpriced = percentageDiff < -5;

    let recommendation = "";
    let riskLevel: "low" | "medium" | "high" = "medium";

    if (isGoodDeal) {
      recommendation = percentageDiff > 25
        ? "Excelente oportunidade! Preço muito abaixo da FIPE. Verifique documentação e histórico."
        : "Boa oportunidade! Preço abaixo da tabela FIPE.";
      riskLevel = percentageDiff > 35 ? "high" : "low";
    } else if (isFairPrice) {
      recommendation = "Preço dentro da faixa de mercado. Considere condição do veículo.";
      riskLevel = "low";
    } else {
      recommendation = "Preço acima da tabela FIPE. Avalie se há diferenciais que justifiquem.";
      riskLevel = "medium";
    }

    return NextResponse.json({
      vehicle: {
        brand: fipeData.Marca,
        model: fipeData.Modelo,
        year: fipeData.AnoModelo,
        fuel: fipeData.Combustivel,
        fipeCode: fipeData.CodigoFipe,
      },
      fipePrice,
      fipePriceFormatted: fipeData.Valor,
      lotPrice,
      comparison: {
        difference: Math.round(difference * 100) / 100,
        percentageDiff: Math.round(percentageDiff * 100) / 100,
        isGoodDeal,
        isFairPrice,
        isOverpriced,
        recommendation,
        riskLevel,
      },
      referenceMonth: fipeData.MesReferencia,
      consultedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro na comparação FIPE:", error);
    return NextResponse.json(
      { error: "Erro interno ao comparar com FIPE" },
      { status: 500 }
    );
  }
}
