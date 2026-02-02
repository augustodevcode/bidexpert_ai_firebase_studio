// src/app/admin/report-builder/designer/[id]/page.tsx
/**
 * @fileoverview Página do Designer de Relatórios com GrapesJS.
 * Interface visual drag-and-drop para criação/edição de templates.
 * 
 * Arquitetura: Composite (GrapesJS + Puppeteer + Handlebars)
 * @see REPORT_BUILDER_ARCHITECTURE.md
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import DesignerClient from './designer-client';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  
  if (id === 'new') {
    return {
      title: 'Novo Relatório | BidExpert Report Builder',
      description: 'Crie um novo template de relatório',
    };
  }
  
  return {
    title: 'Editor de Relatório | BidExpert Report Builder',
    description: 'Edite o template do relatório',
  };
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function DesignerSkeleton() {
  return (
    <div className="flex flex-col h-screen" data-ai-id="designer-skeleton">
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="flex flex-1">
        {/* Left panel */}
        <div className="w-72 border-r p-4">
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
        
        {/* Canvas */}
        <div className="flex-1 bg-muted/50 p-8">
          <Skeleton className="h-full w-full max-w-[210mm] mx-auto" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getReportData(id: string) {
  if (id === 'new') {
    return null;
  }
  
  try {
    const tenantId = await getTenantIdFromRequest();
    
    const report = await prisma.report.findFirst({
      where: { 
        id: BigInt(id),
        tenantId,
      },
      include: {
        User: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
    
    if (!report) {
      return null;
    }
    
    // Serialize BigInt
    return {
      id: report.id.toString(),
      name: report.name,
      description: report.description,
      definition: report.definition as any,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      createdBy: report.User ? {
        id: report.User.id.toString(),
        name: report.User.fullName,
        email: report.User.email,
      } : null,
    };
  } catch (error) {
    console.error('Erro ao buscar relatório:', error);
    return null;
  }
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDesignerPage({ params }: PageProps) {
  const { id } = await params;
  
  const report = await getReportData(id);
  
  // Se não for "new" e não encontrar o relatório, retorna 404
  if (id !== 'new' && !report) {
    notFound();
  }
  
  return (
    <div className="h-screen flex flex-col" data-ai-id="report-designer-page">
      <Suspense fallback={<DesignerSkeleton />}>
        <DesignerClient 
          reportId={id === 'new' ? undefined : id}
          initialReport={report}
        />
      </Suspense>
    </div>
  );
}
