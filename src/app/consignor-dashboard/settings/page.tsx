// src/app/consignor-dashboard/settings/page.tsx
/**
 * @fileoverview Página de Configurações do Painel do Comitente.
 * Este componente permite que um comitente edite seu próprio perfil.
 * Para administradores, oferece um seletor para editar o perfil de qualquer
 * comitente cadastrado, agindo como um atalho de administração.
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getSeller, getSellers } from '@/app/admin/sellers/actions';
import { updateConsignorProfile } from '../actions';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import type { SellerProfileInfo, JudicialBranch, SellerFormData } from '@/types';
import { Loader2, Users } from 'lucide-react';
import SellerForm from '@/app/admin/sellers/seller-form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import FormPageLayout from '@/components/admin/form-page-layout';

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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isUserAdmin = hasPermission(userProfileWithPermissions, 'manage_all');

  // Fetch all sellers if the user is an admin
  useEffect(() => {
    if (isUserAdmin) {
      getSellers(true).then(sellers => { // Public call for admin
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

  const handleUpdate = async (data: SellerFormData) => {
    setIsSubmitting(true);
    const sellerIdToUpdate = isUserAdmin ? selectedSellerId : userProfileWithPermissions?.sellerId;
    if (!sellerIdToUpdate) {
      toast({ title: 'Erro', description: 'ID do comitente não encontrado.', variant: 'destructive'});
      setIsSubmitting(false);
      return;
    }
    const result = await updateConsignorProfile(sellerIdToUpdate, data);
    
     if (result.success) {
      toast({ title: 'Sucesso!', description: 'Perfil atualizado.' });
      fetchData(sellerIdToUpdate); // Refetch data to show updates
    } else {
      toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };
  
  const handleSaveTrigger = () => {
    formRef.current?.requestSubmit();
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
     return (
        <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-destructive">{error}</h2>
        </div>
     );
  }
  
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
        <FormPageLayout
          formTitle="Configurações do Perfil de Comitente"
          formDescription="Atualize os detalhes do seu perfil público de vendedor."
          icon={Users}
          isViewMode={false} // Always in edit mode here
          isSubmitting={isSubmitting}
          onSave={handleSaveTrigger}
          onCancel={() => router.back()}
        >
            <SellerForm
                ref={formRef}
                initialData={sellerProfile}
                judicialBranches={judicialBranches}
                onSubmitAction={handleUpdate}
            />
        </FormPageLayout>
      ) : (
        <div className="flex justify-center items-center h-64">
          {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <p>Selecione um comitente para ver os detalhes.</p>}
        </div>
      )}
    </div>
  );
}
