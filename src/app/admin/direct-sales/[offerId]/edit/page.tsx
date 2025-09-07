// src/app/admin/direct-sales/[offerId]/edit/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import DirectSaleForm from '../../direct-sale-form';
import { getDirectSaleOffer, updateDirectSaleOffer, deleteDirectSaleOffer, type DirectSaleOfferFormData } from '../../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { ShoppingCart } from 'lucide-react';
import type { DirectSaleOffer, LotCategory, SellerProfileInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function EditDirectSaleOfferPage() {
  const params = useParams();
  const offerId = params.offerId as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [offer, setOffer] = useState<DirectSaleOffer | null>(null);
  const [categories, setCategories] = useState<LotCategory[]>([]);
  const [sellers, setSellers] = useState<SellerProfileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);
  const formRef = useRef<any>(null);

  const fetchPageData = useCallback(async () => {
    if (!offerId) return;
    setIsLoading(true);
    try {
      const [fetchedOffer, fetchedCategories, fetchedSellers] = await Promise.all([
        getDirectSaleOffer(offerId),
        getLotCategories(),
        getSellers()
      ]);

      if (!fetchedOffer) {
        notFound();
        return;
      }
      setOffer(fetchedOffer);
      setCategories(fetchedCategories);
      setSellers(fetchedSellers);
    } catch (e) {
      console.error("Failed to fetch direct sale offer data:", e);
      toast({ title: "Erro", description: "Falha ao buscar dados da oferta.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [offerId, toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  
  const handleFormSubmit = async (data: Partial<DirectSaleOfferFormData>) => {
    setIsSubmitting(true);
    const result = await updateDirectSaleOffer(offerId, data);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Oferta atualizada.' });
      fetchPageData();
      setIsViewMode(true);
    } else {
      toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };
  
  const handleDelete = async () => {
    const result = await deleteDirectSaleOffer(offerId);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/direct-sales');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  };

  const handleSave = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <FormPageLayout
      formTitle={isViewMode ? "Visualizar Oferta" : "Editar Oferta"}
      formDescription={offer?.title || 'Carregando...'}
      icon={ShoppingCart}
      isViewMode={isViewMode}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onEnterEditMode={() => setIsViewMode(false)}
      onCancel={() => setIsViewMode(true)}
      onSave={handleSave}
      onDelete={handleDelete}
    >
      <DirectSaleForm
        ref={formRef}
        initialData={offer}
        categories={categories}
        sellers={sellers}
        onSubmitAction={handleFormSubmit}
      />
    </FormPageLayout>
  );
}
