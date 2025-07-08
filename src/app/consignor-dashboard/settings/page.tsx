// src/app/consignor-dashboard/settings/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getSeller, updateSeller } from '@/app/admin/sellers/actions';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import type { SellerProfileInfo, JudicialBranch, SellerFormData } from '@/types';
import { Loader2 } from 'lucide-react';
import SellerForm from '@/app/admin/sellers/seller-form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

/**
 * Page for consignors to edit their own profile settings.
 * It fetches the current user's seller profile and provides a form to update it.
 */
export default function ConsignorSettingsPage() {
  const { userProfileWithPermissions, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [sellerProfile, setSellerProfile] = useState<SellerProfileInfo | null>(null);
  const [judicialBranches, setJudicialBranches] = useState<JudicialBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const sellerId = userProfileWithPermissions?.sellerId;

  // Fetches initial data needed for the form
  const fetchData = useCallback(async () => {
    if (!sellerId) {
      setError("Perfil de comitente não encontrado na sua conta.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const [sellerData, branchesData] = await Promise.all([
        getSeller(sellerId),
        getJudicialBranches()
      ]);

      if (!sellerData) {
        throw new Error("Não foi possível carregar os dados do seu perfil de comitente.");
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
  }, [sellerId, toast]);
  
  // Trigger data fetching when the component mounts or user auth state changes
  useEffect(() => {
    if (!authLoading && userProfileWithPermissions) {
      fetchData();
    } else if (!authLoading) {
      // Handle the case where the user is loaded but not a consignor
      setIsLoading(false);
      setError("Você precisa estar logado como comitente para ver esta página.");
    }
  }, [authLoading, userProfileWithPermissions, fetchData]);

  /**
   * Handles the form submission by calling the updateSeller server action.
   * This function is wrapped in a server action-compatible format.
   * @param {Partial<SellerFormData>} data The updated data from the form.
   */
  async function handleUpdateMyProfile(data: Partial<SellerFormData>) {
    'use server';
    if (!sellerId) {
        return { success: false, message: "ID do comitente não encontrado. Não é possível salvar." };
    }
    return updateSeller(sellerId, data);
  }

  // Display a loading state while authentication or data fetching is in progress
  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  // Display an error message if something went wrong
  if (error || !sellerProfile) {
     return (
        <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-destructive">{error || "Perfil não encontrado."}</h2>
        </div>
     );
  }

  // Render the form once data is available
  return (
    <SellerForm
      initialData={sellerProfile}
      judicialBranches={judicialBranches}
      onSubmitAction={handleUpdateMyProfile}
      formTitle="Minhas Configurações de Comitente"
      formDescription="Atualize os detalhes do seu perfil público de vendedor."
      submitButtonText="Salvar Alterações"
    />
  );
}
