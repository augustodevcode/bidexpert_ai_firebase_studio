// src/app/admin/lots-v2/new/page.tsx
/**
 * @fileoverview Página para criação de um novo Lote V2.
 * Carrega todas as dependências em paralelo e renderiza o formulário V2.
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Package, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import type { Auction, LotCategory, StateInfo, CityInfo } from '@/types';
import { createLotV2 } from '../actions';
import type { LotFormValuesV2 } from '../lot-form-schema-v2';
import LotFormV2 from '../components/lot-form-v2';

import { getAuctions } from '@/app/admin/auctions/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';

interface PageDependencies {
  auctions: Auction[];
  categories: LotCategory[];
  states: StateInfo[];
  allCities: CityInfo[];
}

export default function NewLotPageV2() {
  const router = useRouter();
  const { toast } = useToast();
  const [deps, setDeps] = useState<PageDependencies | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDeps = useCallback(async () => {
    setIsLoading(true);
    try {
      const [auctions, categories, states, cities] = await Promise.all([
        getAuctions(),
        getLotCategories(),
        getStates(),
        getCities(),
      ]);
      setDeps({ auctions, categories, states, allCities: cities });
    } catch (error) {
      console.error('[loadDeps lots-v2/new]', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados necessários para o formulário.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDeps();
  }, [loadDeps]);

  const handleSubmit = useCallback(
    async (data: LotFormValuesV2) => {
      const result = await createLotV2(data);
      if (result.success && result.data?.lotId) {
        router.push(`/admin/lots-v2/${result.data.lotId}`);
      }
      return { success: result.success, message: result.message };
    },
    [router],
  );

  return (
    <div className="space-y-6" data-ai-id="admin-lots-v2-new-page">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Novo Lote (V2)
            </CardTitle>
            <CardDescription>
              Preencha os dados do novo lote e associe-o a um leilão.
            </CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/lots-v2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar à listagem
            </Link>
          </Button>
        </CardHeader>
      </Card>

      {/* Form */}
      {isLoading || !deps ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : (
        <LotFormV2
          auctions={deps.auctions}
          categories={deps.categories}
          states={deps.states}
          allCities={deps.allCities}
          onSubmit={handleSubmit}
          submitLabel="Criar Lote"
        />
      )}
    </div>
  );
}
