// src/app/admin/direct-sales/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import DirectSaleForm from '../direct-sale-form';
import { createDirectSaleOffer, type DirectSaleOfferFormData } from '../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { ShoppingCart, Loader2 } from 'lucide-react';
import type { LotCategory, SellerProfileInfo } from '@/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

function NewDirectSaleOfferPageContent({ categories, sellers }: { categories: LotCategory[]; sellers: SellerProfileInfo[]}) {
    const router = useRouter();
    const { toast } = useToast();
    
    async function handleCreate(data: DirectSaleOfferFormData) {
        const result = await createDirectSaleOffer(data);
        if (result.success) {
            toast({ title: "Sucesso!", description: "Oferta criada com sucesso."});
            router.push('/admin/direct-sales');
        } else {
            toast({ title: "Erro ao Criar", description: result.message, variant: "destructive"});
        }
        return result;
    }
    
    return (
        <FormPageLayout
            pageTitle="Nova Oferta de Venda Direta"
            pageDescription="Preencha os detalhes para criar uma nova oferta."
            icon={ShoppingCart}
            isEdit={false}
        >
            {(formRef) => (
                 <DirectSaleForm
                    ref={formRef}
                    categories={categories}
                    sellers={sellers}
                    onSubmitAction={handleCreate}
                />
            )}
        </FormPageLayout>
    );
}


export default function NewDirectSaleOfferPage() {
    const [pageData, setPageData] = useState<{categories: LotCategory[], sellers: SellerProfileInfo[]} | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const [categories, sellers] = await Promise.all([
                getLotCategories(),
                getSellers()
            ]);
            setPageData({ categories, sellers });
            setIsLoading(false);
        }
        loadData();
    }, []);
    
    if (isLoading || !pageData) {
        return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    
    return <NewDirectSaleOfferPageContent {...pageData} />;
}
