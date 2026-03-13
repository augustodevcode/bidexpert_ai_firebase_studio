/**
 * Tipos de dados da tabela DirectSaleOffer (Ofertas de Venda Direta).
 */
export interface DirectSaleOfferRow {
  id: string;
  publicId: string;
  title: string;
  description: string;
  offerType: string;
  price: number | null;
  minimumOfferPrice: number | null;
  status: string;
  locationCity: string;
  locationState: string;
  imageUrl: string;
  expiresAt: string;
  categoryName: string;
  categoryId: string;
  sellerName: string;
  sellerId: string;
  views: number;
  createdAt: string;
}
