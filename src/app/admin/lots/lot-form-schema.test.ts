import { lotFormSchema, LotFormValues } from './lot-form-schema';
import type { LotStatus } from '@/types';

describe('lotFormSchema', () => {
  const validLotStatus: LotStatus = 'ABERTO_PARA_LANCES';

  const validInput: LotFormValues = {
    title: 'Lote de Veículo Sedan 2020',
    auctionId: 'auction_123',
    auctionName: 'Leilão de Veículos Seminovos',
    description: 'Veículo em ótimo estado, baixa quilometragem.',
    price: 50000,
    initialPrice: 48000,
    status: validLotStatus,
    stateId: 'SP',
    cityId: 'city_abc',
    type: 'Veículo de Passeio',
    imageUrl: 'https://example.com/lote-veiculo.jpg',
    galleryImageUrls: ['https://example.com/veiculo-frente.jpg', 'https://example.com/veiculo-interior.jpg'],
    mediaItemIds: ['media_xyz', 'media_abc'],
    endDate: new Date(2024, 11, 20, 16, 0, 0), // 20 de Dezembro de 2024, 16:00
    lotSpecificAuctionDate: new Date(2024, 11, 15, 10, 0, 0),
    secondAuctionDate: new Date(2024, 11, 25, 10, 0, 0),
    secondInitialPrice: 45000,
    views: 150,
    bidsCount: 10,
  };

  it('should validate with correct data', () => {
    const result = lotFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  // Testes para title
  it('should fail if title is too short', () => {
    const invalidData = { ...validInput, title: 'Lote' };
    const result = lotFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['title']);
      expect(result.error.issues[0].message).toBe('O título do lote deve ter pelo menos 5 caracteres.');
    }
  });

  it('should fail if title is empty', () => {
    const invalidData = { ...validInput, title: '' };
    const result = lotFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['title']);
    }
  });

  // Testes para auctionId
  it('should fail if auctionId is empty', () => {
    const invalidData = { ...validInput, auctionId: '' };
    const result = lotFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['auctionId']);
      expect(result.error.issues[0].message).toBe('O ID do Leilão é obrigatório.');
    }
  });

  // Testes para price
  it('should fail if price is not positive', () => {
    const invalidData = { ...validInput, price: 0 };
    const result = lotFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['price']);
      expect(result.error.issues[0].message).toBe('O preço (lance inicial) deve ser um número positivo.');
    }
  });

  it('should coerce price from string to number if valid', () => {
    const dataWithStringPrice = { ...validInput, price: "60000" as any };
    const result = lotFormSchema.safeParse(dataWithStringPrice);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(60000);
    }
  });

  // Testes para initialPrice
  it('should fail if initialPrice is not positive', () => {
    const invalidData = { ...validInput, initialPrice: -10 };
    const result = lotFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['initialPrice']);
    }
  });

  // Testes para status
  it('should fail if status is an invalid enum value', () => {
    const invalidData = { ...validInput, status: 'INVALID_STATUS' as LotStatus };
    const result = lotFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['status']);
    }
  });

  // Testes para type (categoria do lote)
  it('should fail if type is empty', () => {
    const invalidData = { ...validInput, type: '' };
    const result = lotFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['type']);
      expect(result.error.issues[0].message).toBe('O tipo/categoria do lote é obrigatório.');
    }
  });

  // Testes para imageUrl
  it('should fail if imageUrl is an invalid URL', () => {
    const invalidData = { ...validInput, imageUrl: 'not_a_valid_url' };
    const result = lotFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['imageUrl']);
      expect(result.error.issues[0].message).toBe('Por favor, insira uma URL de imagem válida.');
    }
  });

  it('should pass if imageUrl is an empty string (optional or literal)', () => {
    const dataWithEmptyImageUrl = { ...validInput, imageUrl: '' };
    const result = lotFormSchema.safeParse(dataWithEmptyImageUrl);
    expect(result.success).toBe(true);
  });

  // Testes para galleryImageUrls
  it('should fail if any galleryImageUrl is an invalid URL', () => {
    const invalidData = { ...validInput, galleryImageUrls: ['https://example.com/valid.jpg', 'invalid_url'] };
    const result = lotFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['galleryImageUrls', 1]);
      expect(result.error.issues[0].message).toBe('Uma das URLs da galeria é inválida.');
    }
  });

  it('should pass if galleryImageUrls is empty (optional)', () => {
    const dataWithoutGallery = { ...validInput, galleryImageUrls: [] };
    const result = lotFormSchema.safeParse(dataWithoutGallery);
    expect(result.success).toBe(true);
  });

  // Testes para endDate (tipo já é validado pelo Zod como data)

  // Testes para secondInitialPrice
  it('should fail if secondInitialPrice is not positive when provided', () => {
    const invalidData = { ...validInput, secondInitialPrice: 0 };
    const result = lotFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['secondInitialPrice']);
    }
  });

  it('should pass if secondInitialPrice is null (optional nullable)', () => {
    const dataWithNullSecondPrice = { ...validInput, secondInitialPrice: null };
    const result = lotFormSchema.safeParse(dataWithNullSecondPrice);
    expect(result.success).toBe(true);
  });

  it('should pass if secondInitialPrice is not provided (optional)', () => {
    const dataWithoutSecondPrice = { ...validInput };
    delete dataWithoutSecondPrice.secondInitialPrice;
    const result = lotFormSchema.safeParse(dataWithoutSecondPrice);
    expect(result.success).toBe(true);
  });

  // Testes para views e bidsCount (coerção e tipo)
  it('should coerce views to number if valid string', () => {
    const dataWithStringViews = { ...validInput, views: "100" as any };
    const result = lotFormSchema.safeParse(dataWithStringViews);
    expect(result.success).toBe(true);
    if(result.success) {
      expect(result.data.views).toBe(100);
    }
  });

  it('should fail if views is negative', () => {
    const invalidData = { ...validInput, views: -1 };
    const result = lotFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['views']);
    }
  });
});

console.log('Arquivo de teste src/app/admin/lots/lot-form-schema.test.ts criado/atualizado.');
