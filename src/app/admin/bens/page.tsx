// src/app/admin/bens/page.tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBens, deleteBem } from './actions';
import type { Bem } from '@/types';
import { PlusCircle, Package } from 'lucide-react';
import { createColumns } from './columns';
import BemDetailsModal from '@/components/admin/bens/bem-details-modal';
import ResourceDataTable from '@/components/admin/resource-data-table';

export default function AdminBensPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBem, setSelectedBem] = useState<Bem | null>(null);

  const handleOpenDetails = useCallback((bem: Bem) => {
    setSelectedBem(bem);
    setIsModalOpen(true);
  }, []);

  const columns = useMemo(() => createColumns({
    // A ação de delete será passada para o ResourceDataTable, mas a coluna pode precisar de um handler para o modal.
    handleDelete: async () => {}, // Ação vazia, pois o ResourceDataTable cuida disso.
    onOpenDetails: handleOpenDetails 
  }), [handleOpenDetails]);

  return (
    <>
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <Package className="h-6 w-6 mr-2 text-primary" />
                Gerenciar Bens
              </CardTitle>
              <CardDescription>
                Cadastre e gerencie os bens individuais que poderão ser loteados.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/bens/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Bem
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
             <ResourceDataTable<Bem>
                columns={columns}
                fetchAction={getBens}
                deleteAction={deleteBem}
                searchColumnId="title"
                searchPlaceholder="Buscar por título..."
                deleteConfirmation={(item) => item.status === 'DISPONIVEL' || item.status === 'CADASTRO'}
                deleteConfirmationMessage={(item) => `Este bem está no status "${item.status}" e não pode ser excluído.`}
            />
          </CardContent>
        </Card>
      </div>
       <BemDetailsModal 
        bem={selectedBem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
