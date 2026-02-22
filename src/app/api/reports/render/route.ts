// src/app/api/reports/render/route.ts
/**
 * @fileoverview API Route para renderização de relatórios em PDF/HTML.
 * Utiliza Puppeteer para conversão de HTML para PDF com suporte a CSS Paged Media.
 * 
 * Arquitetura: Composite (GrapesJS + Puppeteer + Handlebars)
 * @see REPORT_BUILDER_ARCHITECTURE.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import { serializeBigInt } from '@/lib/utils';
import Handlebars from 'handlebars';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// ============================================================================
// HANDLEBARS HELPERS
// ============================================================================

// Registrar helpers do Handlebars
Handlebars.registerHelper('formatDate', function(date: Date | string | null, format: string) {
  if (!date) return '-';
  const d = new Date(date);
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const tokens: Record<string, string> = {
    'DD': pad(d.getDate()),
    'MM': pad(d.getMonth() + 1),
    'YYYY': d.getFullYear().toString(),
    'YY': d.getFullYear().toString().slice(-2),
    'HH': pad(d.getHours()),
    'mm': pad(d.getMinutes()),
    'ss': pad(d.getSeconds()),
  };
  
  let result = format;
  for (const [token, value] of Object.entries(tokens)) {
    result = result.replace(token, value);
  }
  
  return result;
});

Handlebars.registerHelper('formatCurrency', function(value: number | null) {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
});

Handlebars.registerHelper('formatNumber', function(value: number | null, decimals = 2) {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('pt-BR', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
});

Handlebars.registerHelper('ifEquals', function(arg1: any, arg2: any, options: any) {
  return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('ifNotEquals', function(arg1: any, arg2: any, options: any) {
  return (arg1 !== arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('json', function(context: any) {
  return JSON.stringify(context, null, 2);
});

Handlebars.registerHelper('uppercase', function(str: string) {
  return str?.toUpperCase() || '';
});

Handlebars.registerHelper('lowercase', function(str: string) {
  return str?.toLowerCase() || '';
});

Handlebars.registerHelper('default', function(value: any, defaultValue: any) {
  return value ?? defaultValue;
});

Handlebars.registerHelper('math', function(lvalue: number, operator: string, rvalue: number) {
  switch (operator) {
    case '+': return lvalue + rvalue;
    case '-': return lvalue - rvalue;
    case '*': return lvalue * rvalue;
    case '/': return lvalue / rvalue;
    case '%': return lvalue % rvalue;
    default: return lvalue;
  }
});

Handlebars.registerHelper('index', function(array: any[], index: number) {
  return array?.[index];
});

Handlebars.registerHelper('length', function(array: any[]) {
  return array?.length || 0;
});

// ============================================================================
// TYPES
// ============================================================================

interface RenderRequest {
  reportId?: string;
  templateHtml?: string;
  templateCss?: string;
  dataContext?: string; // 'AUCTION' | 'LOT' | 'BIDDER' | etc.
  entityId?: string;
  format?: 'pdf' | 'html';
  options?: {
    pageSize?: 'A4' | 'Letter' | 'Legal';
    orientation?: 'portrait' | 'landscape';
    margins?: { top: string; right: string; bottom: string; left: string };
    headerTemplate?: string;
    footerTemplate?: string;
    displayHeaderFooter?: boolean;
  };
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchDataForContext(
  context: string,
  entityId: string,
  tenantId: bigint
): Promise<Record<string, any>> {
  const bigIntId = BigInt(entityId);
  
  switch (context.toUpperCase()) {
    case 'AUCTION':
      const auction = await prisma.auction.findFirst({
        where: { id: bigIntId, tenantId },
        include: {
          Auctioneer: true,
          Seller: true,
          Lot: {
            include: {
              LotCategory: true,
              User: true, // Winner
            },
            orderBy: { number: 'asc' },
          },
          City: true,
          State: true,
          JudicialProcess: {
            include: {
              Court: true,
              JudicialDistrict: true,
              JudicialBranch: true,
              JudicialParty: true,
            },
          },
        },
      });
      
      if (!auction) throw new Error('Leilão não encontrado');
      
      return {
        auction: {
          ...serializeBigInt(auction),
          auctioneer: auction.Auctioneer ? serializeBigInt(auction.Auctioneer) : null,
          seller: auction.Seller ? serializeBigInt(auction.Seller) : null,
          lots: auction.Lot.map(lot => ({
            ...serializeBigInt(lot),
            category: lot.LotCategory ? serializeBigInt(lot.LotCategory) : null,
            winner: lot.User ? serializeBigInt(lot.User) : null,
          })),
          city: auction.City ? serializeBigInt(auction.City) : null,
          state: auction.State ? serializeBigInt(auction.State) : null,
          judicialProcess: auction.JudicialProcess ? serializeBigInt(auction.JudicialProcess) : null,
        },
      };
    
    case 'LOT':
      const lot = await prisma.lot.findFirst({
        where: { id: bigIntId, tenantId },
        include: {
          Auction: {
            include: {
              Auctioneer: true,
              Seller: true,
            },
          },
          LotCategory: true,
          Subcategory: true,
          User: true, // Winner
          City: true,
          State: true,
          LotDocument: true,
          Bid: {
            orderBy: { timestamp: 'desc' },
            take: 10,
            include: { User: true },
          },
        },
      });
      
      if (!lot) throw new Error('Lote não encontrado');
      
      return {
        lot: {
          ...serializeBigInt(lot),
          auction: lot.Auction ? serializeBigInt(lot.Auction) : null,
          category: lot.LotCategory ? serializeBigInt(lot.LotCategory) : null,
          subcategory: lot.Subcategory ? serializeBigInt(lot.Subcategory) : null,
          winner: lot.User ? serializeBigInt(lot.User) : null,
          city: lot.City ? serializeBigInt(lot.City) : null,
          state: lot.State ? serializeBigInt(lot.State) : null,
          documents: lot.LotDocument.map(d => serializeBigInt(d)),
          recentBids: lot.Bid.map(b => ({
            ...serializeBigInt(b),
            bidder: b.User ? serializeBigInt(b.User) : null,
          })),
        },
      };
    
    case 'BIDDER':
      const user = await prisma.user.findFirst({
        where: { id: bigIntId, tenantId },
        include: {
          UserAddress: true,
          Bid: {
            orderBy: { timestamp: 'desc' },
            take: 20,
            include: {
              Lot: true,
              Auction: true,
            },
          },
          UserWin: {
            include: {
              Lot: true,
              Auction: true,
            },
          },
        },
      });
      
      if (!user) throw new Error('Usuário não encontrado');
      
      return {
        bidder: {
          ...serializeBigInt(user),
          address: user.UserAddress ? serializeBigInt(user.UserAddress) : null,
          recentBids: user.Bid.map(b => ({
            ...serializeBigInt(b),
            lot: b.Lot ? serializeBigInt(b.Lot) : null,
            auction: b.Auction ? serializeBigInt(b.Auction) : null,
          })),
          wins: user.UserWin.map(w => ({
            ...serializeBigInt(w),
            lot: w.Lot ? serializeBigInt(w.Lot) : null,
            auction: w.Auction ? serializeBigInt(w.Auction) : null,
          })),
          totalBids: user.Bid.length,
          totalWins: user.UserWin.length,
          totalSpent: user.UserWin.reduce((sum, w) => sum + Number(w.winningBid || 0), 0),
        },
      };
    
    case 'COURT_CASE':
      const process = await prisma.judicialProcess.findFirst({
        where: { id: bigIntId, tenantId },
        include: {
          Court: true,
          JudicialDistrict: true,
          JudicialBranch: true,
          JudicialParty: true,
          Seller: true,
          Auction: true,
          Asset: true,
        },
      });
      
      if (!process) throw new Error('Processo não encontrado');
      
      return {
        courtCase: {
          ...serializeBigInt(process),
          court: process.Court ? serializeBigInt(process.Court) : null,
          district: process.JudicialDistrict ? serializeBigInt(process.JudicialDistrict) : null,
          branch: process.JudicialBranch ? serializeBigInt(process.JudicialBranch) : null,
          parties: process.JudicialParty.map(p => serializeBigInt(p)),
          seller: process.Seller ? serializeBigInt(process.Seller) : null,
          auctions: process.Auction.map(a => serializeBigInt(a)),
          assets: process.Asset.map(a => serializeBigInt(a)),
        },
      };
    
    default:
      throw new Error(`Contexto de dados não suportado: ${context}`);
  }
}

// ============================================================================
// PDF GENERATION
// ============================================================================

async function generatePDF(
  html: string,
  css: string,
  options: RenderRequest['options'] = {}
): Promise<Buffer> {
  // Dynamic import for Puppeteer (only needed server-side)
  const puppeteer = await import('puppeteer');
  
  const browser = await puppeteer.default.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({
      width: 794, // A4 width at 96 DPI
      height: 1123, // A4 height at 96 DPI
      deviceScaleFactor: 2,
    });
    
    // Build full HTML document
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    @page {
      size: ${options.pageSize || 'A4'} ${options.orientation || 'portrait'};
      margin: ${options.margins?.top || '20mm'} ${options.margins?.right || '15mm'} ${options.margins?.bottom || '20mm'} ${options.margins?.left || '15mm'};
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      tr { page-break-inside: avoid; }
      
      .report-page-break { page-break-before: always; }
      .report-footer { position: fixed; bottom: 0; left: 0; right: 0; }
      .report-header { position: fixed; top: 0; left: 0; right: 0; }
    }
    
    body {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1f2937;
    }
    
    .report-variable {
      background: transparent !important;
      border: none !important;
      padding: 0 !important;
    }
    
    ${css}
  </style>
</head>
<body class="p-0 m-0">
  ${html}
</body>
</html>`;
    
    // Set content and wait for network idle (important for images)
    await page.setContent(fullHtml, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000,
    });
    
    // Wait for images to load
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(img => new Promise(resolve => {
            img.onload = img.onerror = resolve;
          }))
      );
    });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: options.pageSize || 'A4',
      landscape: options.orientation === 'landscape',
      printBackground: true,
      margin: {
        top: options.margins?.top || '20mm',
        right: options.margins?.right || '15mm',
        bottom: options.margins?.bottom || '20mm',
        left: options.margins?.left || '15mm',
      },
      displayHeaderFooter: options.displayHeaderFooter || false,
      headerTemplate: options.headerTemplate || '',
      footerTemplate: options.footerTemplate || `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
          <span class="pageNumber"></span> de <span class="totalPages"></span>
        </div>
      `,
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

// ============================================================================
// API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }
    
    const tenantId = await getTenantIdFromRequest();
    const body: RenderRequest = await request.json();
    
    const { 
      reportId, 
      templateHtml, 
      templateCss, 
      dataContext, 
      entityId,
      format = 'pdf',
      options = {} 
    } = body;
    
    let html = templateHtml || '';
    let css = templateCss || '';
    
    // If reportId provided, fetch template from database
    if (reportId) {
      const report = await prisma.report.findFirst({
        where: { 
          id: BigInt(reportId), 
          tenantId,
        },
      });
      
      if (!report) {
        return NextResponse.json(
          { error: 'Relatório não encontrado' },
          { status: 404 }
        );
      }
      
      const definition = report.definition as any;
      html = definition?.html || '';
      css = definition?.css || '';
    }
    
    if (!html) {
      return NextResponse.json(
        { error: 'Template HTML não fornecido' },
        { status: 400 }
      );
    }
    
    // Fetch data if context and entityId provided
    let data: Record<string, any> = {
      now: new Date(),
      pageNumber: '{{pageNumber}}', // Placeholder for Puppeteer
      totalPages: '{{totalPages}}',
    };
    
    if (dataContext && entityId) {
      const contextData = await fetchDataForContext(dataContext, entityId, tenantId);
      data = { ...data, ...contextData };
    }
    
    // Compile template with Handlebars
    const template = Handlebars.compile(html);
    let compiledHtml = template(data);
    
    // Sanitize HTML (remove potential XSS)
    const window = new JSDOM('').window;
    const purify = DOMPurify(window as any);
    compiledHtml = purify.sanitize(compiledHtml, {
      ADD_TAGS: ['style'],
      ADD_ATTR: ['style', 'class', 'data-gjs-type', 'data-field-path'],
    });
    
    // Return based on format
    if (format === 'html') {
      return new NextResponse(compiledHtml, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }
    
    // Generate PDF
    const pdfBuffer = await generatePDF(compiledHtml, css, options);
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-${Date.now()}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('Erro ao renderizar relatório:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao renderizar relatório' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Preview HTML
// ============================================================================

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const reportId = searchParams.get('reportId');
  const dataContext = searchParams.get('context');
  const entityId = searchParams.get('entityId');
  
  if (!reportId) {
    return NextResponse.json(
      { error: 'reportId é obrigatório' },
      { status: 400 }
    );
  }
  
  // Redirect to POST with proper parameters
  return POST(new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({
      reportId,
      dataContext,
      entityId,
      format: 'html',
    }),
  }));
}
