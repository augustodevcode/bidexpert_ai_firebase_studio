// src/app/dashboard/wins/page.tsx
/**
 * @fileoverview Página "Meus Arremates" do Painel do Usuário.
 * Agora utiliza o WinsDashboard para uma experiência de controle completa.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { UserWin } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { getWinsForUserAction } from './actions';
import { WinsDashboard } from './components/wins-dashboard';
import { Card } from '@/components/ui/card';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function MyWinsPage() {
  const { userProfileWithPermissions, loading } = useAuth();
  const [wins, setWins] = useState<UserWin[]>([]);
  const [isLoadingWins, setIsLoadingWins] = useState(true);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchWins() {
      if (userProfileWithPermissions?.id) {
        try {
          const userWins = await getWinsForUserAction(userProfileWithPermissions.id);
          setWins(userWins);
        } catch (error) {
          console.error("Failed to fetch wins:", error);
        } finally {
          setIsLoadingWins(false);
        }
      } else if (!loading) {
         setIsLoadingWins(false);
      }
    }
    
    fetchWins();
  }, [userProfileWithPermissions, loading]);

  useEffect(() => {
    if (searchParams.get('payment_success') === 'true') {
        toast({
            title: "Pagamento Realizado com Sucesso!",
            description: "Obrigado por sua compra. Você pode acompanhar os detalhes aqui.",
        });
    }
  }, [searchParams, toast]);

  if (loading || isLoadingWins) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando seus arremates...</span>
      </div>
    );
  }

  if (!userProfileWithPermissions) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
             <p className="text-muted-foreground">Faça login para ver seus arremates.</p>
             <Link href="/auth/login">
                <Button className="mt-4">Fazer Login</Button>
             </Link>
        </div>
      )
  }

  if (wins.length === 0) {
    return (
        <Card className="flex flex-col items-center justify-center p-12 text-center mt-8">
            <div className="bg-muted p-4 rounded-full mb-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhum arremate encontrado</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
                Você ainda não possui lotes arrematados. Explore os leilões disponíveis e dê seus lances!
            </p>
            <Link href="/auctions">
                <Button>Explorar Leilões</Button>
            </Link>
        </Card>
    );
  }

  return (
    <WinsDashboard wins={wins} />
  );
}
