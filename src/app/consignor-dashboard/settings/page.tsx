// src/app/consignor-dashboard/settings/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getSellers, getSeller } from '@/app/admin/sellers/actions';
import { updateConsignorProfile } from '../actions';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import type { SellerProfileInfo, JudicialBranch, SellerFormData } from '@bidexpert/core';
import { Loader2, Users } from 'lucide-react';
import { SellerForm } from '@/app/admin/sellers/seller-form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

/**
 * Page for consignors or admins to edit seller profile settings.
 */
export default function ConsignorSettingsPage() {
  const { userProfileWithPermissions, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<any>(null);

  const [allSellers, setAllSellers] = useState<SellerProfileInfo[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfileInfo | null>(null);
  const [judicialBranches, setJudicialBranches] = useState<JudicialBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUserAdmin = hasPermission(userProfileWithPermissions, 'manage_all');

  // Fetch all sellers if the user is an admin
  useEffect(() => {
    if (isUserAdmin) {
      getSellers().then(sellers => {
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
        getSeller(sellerIdToFetch),
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

  const handleSave = () => {
    formRef.current?.requestSubmit();
  }

  // Handler for form submission
  const handleUpdate = async (data: SellerFormData) => {
    setIsSubmitting(true);
    const sellerIdToUpdate = isUserAdmin ? selectedSellerId : userProfileWithPermissions?.sellerId;
    if (!sellerIdToUpdate) {
        toast({ title: "Erro", description: "ID do comitente não encontrado. Não é possível salvar.", variant: "destructive"});
        setIsSubmitting(false);
        return;
    }
    
    const result = await updateConsignorProfile(sellerIdToUpdate, data);
    
    if(result.success) {
        toast({ title: "Sucesso!", description: "Perfil atualizado com sucesso."});
        fetchData(sellerIdToUpdate);
    } else {
        toast({ title: "Erro ao Salvar", description: result.message, variant: "destructive"});
    }
    setIsSubmitting(false);
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
    <Card className="shadow-lg">
       <CardHeader>
        <CardTitle className="text-2xl font-bold font-headline">Configurações do Perfil de Comitente</CardTitle>
        <CardDescription>
          Edite as informações públicas e de contato do seu perfil de vendedor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isUserAdmin && (
            <div className="p-4 border bg-secondary/50 rounded-md">
                <Label htmlFor="seller-select" className="font-semibold flex items-center gap-2 mb-1"><Users className="h-4 w-4"/> Visualizando como Administrador</Label>
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
            </div>
        )}

        {sellerProfile ? (
            <SellerForm
                ref={formRef}
                initialData={sellerProfile}
                judicialBranches={judicialBranches}
                onSubmitAction={handleUpdate}
            />
        ) : (
            <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )}
      </CardContent>
       <CardFooter className="flex justify-end p-6 border-t">
        <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
            Salvar Alterações
        </Button>
      </CardFooter>
    </Card>
  );
}
