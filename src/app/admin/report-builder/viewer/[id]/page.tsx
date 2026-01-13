// src/app/admin/report-builder/viewer/[id]/page.tsx
/**
 * @fileoverview Página de visualização de relatório individual.
 * Renderiza o Report Viewer com dados carregados do servidor.
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ReportViewerClient } from './viewer-client';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ReportViewerPage({ params, searchParams }: PageProps) {
  const { id } = params;

  if (!id) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<ViewerSkeleton />}>
        <ReportViewerClient reportId={id} initialParams={searchParams} />
      </Suspense>
    </div>
  );
}

function ViewerSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}
