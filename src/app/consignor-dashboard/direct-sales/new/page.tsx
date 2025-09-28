// src/app/consignor-dashboard/direct-sales/new/page.tsx
/**
 * @fileoverview Página para um Comitente logado criar uma nova Oferta de Venda Direta.
 * Este componente de cliente carrega os dados necessários (categorias e o perfil
 * do próprio comitente) e renderiza o `DirectSaleForm`, pré-populando e
 * restringindo a seleção de vendedor ao usuário atual.
 */
'use client';

import { useState, useEffect } from 'react';
import DirectSaleForm from '@/app/admin/direct-sales/direct-sale-form';
import { createDirectSaleOffer, type DirectSaleOfferFormData } from '@/app/admin/direct-sales/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSeller } from '@/app/admin/sellers/actions';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { LotCategory, SellerProfileInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';

/**
 * NewConsignorDirectSaleOfferPage allows a logged-in consignor to create a new
 * direct sale offer. It pre-populates the seller information based on the
 * user's profile.
 */
export default function NewConsignorDirectSaleOfferPage() {
  const { userProfileWithPermissions, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<LotCategory[]>([]);
  const [currentSeller, setCurrentSeller] = useState<SellerProfileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    /**
     * Fetches the necessary data (categories and consignor profile) to populate the form.
     */
    async function loadData() {
      if (!userProfileWithPermissions?.sellerId) {
        toast({
          title: "Perfil de Comitente não encontrado",
          description: "Sua conta de usuário não está vinculada a um perfil de comitente.",
          variant: "destructive"
        });
        router.push('/consignor-dashboard/overview');
        return;
      }

      try {
        const [cats, seller] = await Promise.all([
          getLotCategories(),
          getSeller(userProfileWithPermissions.sellerId)
        ]);
        setCategories(cats);
        setCurrentSeller(seller);
      } catch (error) {
        console.error("Error loading data for new offer page:", error);
        toast({ title: "Erro", description: "Não foi possível carregar os dados necessários.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading && userProfileWithPermissions) {
      loadData();
    } else if (!authLoading) {
      setIsLoading(false); // No user, stop loading
    }
  }, [userProfileWithPermissions, authLoading, toast, router]);

  /**
   * Handles the form submission by calling the server action.
   * It ensures the logged-in user's seller name is used.
   * @param {DirectSaleOfferFormData} data The form data.
   */
  async function handleCreateOffer(data: DirectSaleOfferFormData) {
    if (!currentSeller) {
      return { success: false, message: "Informação do vendedor não disponível." };
    }
    // Force the sellerId to be the one from the logged-in consignor's profile
    const dataWithSeller = { ...data, sellerId: currentSeller.id };
    return createDirectSaleOffer(dataWithSeller);
  }

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentSeller) {
    return (
      <div className="text-center py-10">
        <p>Não foi possível carregar seu perfil de comitente.</p>
      </div>
    );
  }

  return (
    <DirectSaleForm
      initialData={{ sellerId: currentSeller.id }} // Pre-fill seller id
      categories={categories}
      sellers={[currentSeller]} // Pass only the current seller
      onSubmitAction={handleCreateOffer}
      formTitle="Nova Oferta de Venda Direta"
      formDescription="Preencha os detalhes para criar uma nova oferta."
      submitButtonText="Criar Oferta"
      successRedirectPath="/consignor-dashboard/direct-sales" // Redirect back to the consignor list
    />
  );
}
