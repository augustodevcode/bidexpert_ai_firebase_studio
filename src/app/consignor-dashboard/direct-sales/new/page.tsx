// src/app/consignor-dashboard/direct-sales/new/page.tsx
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

export default function NewConsignorDirectSaleOfferPage() {
  const { userProfileWithPermissions, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<LotCategory[]>([]);
  const [currentSeller, setCurrentSeller] = useState<SellerProfileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      if (!userProfileWithPermissions?.sellerProfileId) {
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
          getSeller(userProfileWithPermissions.sellerProfileId)
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

  async function handleCreateOffer(data: DirectSaleOfferFormData) {
    'use server';
    if (!currentSeller) {
      return { success: false, message: "Informação do vendedor não disponível." };
    }
    // Ensure the sellerName from the form is the one from the logged-in user
    const dataWithSeller = { ...data, sellerName: currentSeller.name };
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
      initialData={{ sellerName: currentSeller.name }} // Pre-fill seller name
      categories={categories}
      sellers={[currentSeller]} // Pass only the current seller
      onSubmitAction={handleCreateOffer}
      formTitle="Nova Oferta de Venda Direta"
      formDescription="Preencha os detalhes para criar uma nova oferta."
      submitButtonText="Criar Oferta"
    />
  );
}
