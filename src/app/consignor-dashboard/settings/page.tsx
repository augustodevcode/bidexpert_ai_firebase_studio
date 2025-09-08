// src/app/consignor-dashboard/settings/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { obterComitente, obterComitentes } from '@/app/admin/sellers/actions';
import { atualizarPerfilComitente } from '../actions';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import type { SellerProfileInfo, JudicialBranch, SellerFormData } from '@bidexpert/core';
import { Loader2, Users } from 'lucide-react';
import SellerForm from '@/app/admin/sellers/seller-form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

/**
 * Page for consignors or admins to edit seller profile settings.
 */
export default function ConsignorSettingsPage() {
  const { userProfileWithPermissions, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [allSellers, setAllSellers] = useState<SellerProfileInfo[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfileInfo | null>(null);
  const [judicialBranches, setJudicialBranches] = useState<JudicialBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isUserAdmin = hasPermission(userProfileWithPermissions, 'manage_all');

  // Fetch all sellers if the user is an admin
  useEffect(() => {
    if (isUserAdmin) {
      obterComitentes().then(sellers => {
        setAllSellers(sellers);
        if (!selectedSellerId && sellers.length > 0) {
          setSelectedSellerId(sellers[0].id);
        }
      });
    }
  }, [isUserAdmin, selectedSellerId]);

  // Fetches initial data needed for the form
  const fetchData = useCallback(async (sellerIdToFetch: string) => {
    if (!sellerIdToFetch) {
      setError("Nenhum perfil de comitente selecionado.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const [sellerData, branchesData] = await Promise.all([
        obterComitente(sellerIdToFetch),
        getJudicialBranches()
      ]);

      if (!sellerData) {
        throw new Error("Não foi possível carregar os dados do perfil de comitente selecionado.");
      }

      setSellerProfile(sellerData);
      setJudicialBranches(branchesData);

    } catch (e: any) {
      console.error("Error fetching consignor settings data:", e);
      setError(e.message || "Erro ao carregar dados.");
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Effect to decide which seller's data to fetch
  useEffect(() => {
    const targetSellerId = isUserAdmin ? selectedSellerId : userProfileWithPermissions?.sellerId;
    
    if (!authLoading && targetSellerId) {
      fetchData(targetSellerId);
    } else if (!authLoading) {
      setIsLoading(false);
       if (!isUserAdmin) {
        setError("Você precisa ter um perfil de comitente vinculado para ver esta página.");
       }
    }
  }, [authLoading, userProfileWithPermissions, fetchData, isUserAdmin, selectedSellerId]);

  // Handler for form submission
  const handleUpdate = async (data: SellerFormData) => {
    const sellerIdToUpdate = isUserAdmin ? selectedSellerId : userProfileWithPermissions?.sellerId;
    if (!sellerIdToUpdate) {
      return { success: false, message: 'ID do comitente não encontrado. Não é possível salvar.' };
    }
    return atualizarPerfilComitente(sellerIdToUpdate, data);
  };
  
  // Render loading state
  if (authLoading || (isLoading && !sellerProfile)) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  // Render error or empty state
  if (error || (!isUserAdmin && !userProfileWithPermissions?.sellerId)) {
     return (
        <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-destructive">{error || "Perfil de comitente não encontrado na sua conta."}</h2>
        </div>
     );
  }

  // Admin view without any sellers to select
  if (isUserAdmin && allSellers.length === 0 && !isLoading) {
      return (
        <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Nenhum Comitente Cadastrado</h2>
            <p className="text-muted-foreground mt-2">Não há comitentes no sistema para selecionar.</p>
        </div>
      );
  }

  return (
    <div className="space-y-6">
      {isUserAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users /> Visualizando como Administrador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="seller-select">Selecione o Comitente para Editar</Label>
            <Select value={selectedSellerId || ''} onValueChange={setSelectedSellerId}>
              <SelectTrigger id="seller-select" className="w-full md:w-[400px] mt-1">
                <SelectValue placeholder="Selecione um comitente..." />
              </SelectTrigger>
              <SelectContent>
                {allSellers.map(seller => (
                  <SelectItem key={seller.id} value={seller.id}>{seller.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {sellerProfile ? (
        <SellerForm
          initialData={sellerProfile}
          judicialBranches={judicialBranches}
          onSubmitAction={handleUpdate}
        />
      ) : (
        // Show a loader while the selected seller's profile is being fetched
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
