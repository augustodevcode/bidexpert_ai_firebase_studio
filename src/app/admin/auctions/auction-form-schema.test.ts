import { auctionFormSchema, AuctionFormValues } from './auction-form-schema';
import type { AuctionStatus, Auction } from '@/types';

describe('auctionFormSchema', () => {
  const validAuctionStatus: AuctionStatus = 'EM_BREVE';
  const validAuctionType: Auction['auctionType'] = 'EXTRAJUDICIAL';

  const validInput: AuctionFormValues = {
    title: 'Leilão de Imóveis Residenciais',
    fullTitle: 'Grande Leilão de Imóveis Residenciais em São Paulo',
    description: 'Oportunidade única para adquirir imóveis residenciais com ótimos preços.',
    status: validAuctionStatus,
    auctionType: validAuctionType,
    category: 'Imóveis Residenciais',
    auctioneer: 'João Leiloeiro Oficial',
    seller: 'Banco XYZ S.A.',
    auctionDate: new Date(2024, 10, 15, 14, 30, 0), // 15 de Novembro de 2024, 14:30
    endDate: new Date(2024, 10, 20, 18, 0, 0), // 20 de Novembro de 2024, 18:00
    city: 'São Paulo',
    state: 'SP',
    imageUrl: 'https://example.com/leilao-imoveis.jpg',
    documentsUrl: 'https://example.com/edital-leilao-imoveis.pdf',
    sellingBranch: 'Filial Central',
  };

  it('should validate with correct data', () => {
    const result = auctionFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  // Testes para title
  it('should fail if title is too short', () => {
    const invalidData = { ...validInput, title: 'Leil' };
    const result = auctionFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['title']);
      expect(result.error.issues[0].message).toBe('O título do leilão deve ter pelo menos 5 caracteres.');
    }
  });

  it('should fail if title is too long', () => {
    const invalidData = { ...validInput, title: 'L'.repeat(201) };
    const result = auctionFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['title']);
      expect(result.error.issues[0].message).toBe('O título do leilão não pode exceder 200 caracteres.');
    }
  });

  it('should fail if title is empty', () => {
    const invalidData = { ...validInput, title: '' };
    const result = auctionFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['title']);
    }
  });

  // Testes para fullTitle
  it('should fail if fullTitle is too long', () => {
    const invalidData = { ...validInput, fullTitle: 'F'.repeat(301) };
    const result = auctionFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['fullTitle']);
      expect(result.error.issues[0].message).toBe('O título completo não pode exceder 300 caracteres.');
    }
  });

  // Testes para description
  it('should fail if description is too long', () => {
    const invalidData = { ...validInput, description: 'D'.repeat(5001) };
    const result = auctionFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['description']);
      expect(result.error.issues[0].message).toBe('A descrição não pode exceder 5000 caracteres.');
    }
  });

  // Testes para status
  it('should fail if status is not a valid enum value', () => {
    const invalidData = { ...validInput, status: 'INVALID_STATUS' as AuctionStatus };
    const result = auctionFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['status']);
    }
  });

  // Testes para auctionType
  it('should pass if auctionType is not provided (optional)', () => {
    const dataWithoutAuctionType = { ...validInput };
    delete dataWithoutAuctionType.auctionType;
    const result = auctionFormSchema.safeParse(dataWithoutAuctionType);
    expect(result.success).toBe(true);
  });

  it('should fail if auctionType is an invalid enum value', () => {
    const invalidData = { ...validInput, auctionType: 'INVALID_TYPE' as Auction['auctionType'] };
    const result = auctionFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['auctionType']);
    }
  });

  // Testes para category
  it('should fail if category is empty', () => {
    const invalidData = { ...validInput, category: '' };
    const result = auctionFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['category']);
      expect(result.error.issues[0].message).toBe('A categoria é obrigatória.');
    }
  });

  // Testes para auctioneer
  it('should fail if auctioneer is empty', () => {
    const invalidData = { ...validInput, auctioneer: '' };
    const result = auctionFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['auctioneer']);
      expect(result.error.issues[0].message).toBe('O nome do leiloeiro é obrigatório.');
    }
  });

  // Testes para auctionDate (tipo já é validado pelo Zod como data)
  // Testar required_error não é simples aqui pois o Zod infere o tipo antes.
  // Para `z.date()`, se um tipo não-data é passado, ele falha na coerção.

  // Testes para endDate
  it('should pass if endDate is not provided (optional nullable)', () => {
    const dataWithoutEndDate = { ...validInput };
    delete dataWithoutEndDate.endDate;
    const result = auctionFormSchema.safeParse(dataWithoutEndDate);
    expect(result.success).toBe(true);
  });

  it('should pass if endDate is null (optional nullable)', () => {
    const dataWithNullEndDate = { ...validInput, endDate: null };
    const result = auctionFormSchema.safeParse(dataWithNullEndDate);
    expect(result.success).toBe(true);
  });

  // Testes para imageUrl
  it('should fail if imageUrl is an invalid URL', () => {
    const invalidData = { ...validInput, imageUrl: 'not_a_url' };
    const result = auctionFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['imageUrl']);
      expect(result.error.issues[0].message).toBe('URL da imagem inválida.');
    }
  });

  it('should pass if imageUrl is an empty string (optional or literal)', () => {
    const dataWithEmptyImageUrl = { ...validInput, imageUrl: '' };
    const result = auctionFormSchema.safeParse(dataWithEmptyImageUrl);
    expect(result.success).toBe(true);
  });

  // Testes para documentsUrl
  it('should fail if documentsUrl is an invalid URL', () => {
    const invalidData = { ...validInput, documentsUrl: 'not_a_url_doc' };
    const result = auctionFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['documentsUrl']);
      expect(result.error.issues[0].message).toBe('URL dos documentos inválida.');
    }
  });

  it('should pass if documentsUrl is an empty string (optional or literal)', () => {
    const dataWithEmptyDocsUrl = { ...validInput, documentsUrl: '' };
    const result = auctionFormSchema.safeParse(dataWithEmptyDocsUrl);
    expect(result.success).toBe(true);
  });

  // Teste para campo opcional state
  it('should pass if optional field state is not provided', () => {
    const dataWithoutState = { ...validInput };
    delete dataWithoutState.state;
    const result = auctionFormSchema.safeParse(dataWithoutState);
    expect(result.success).toBe(true);
  });

   it('should fail if state (UF) is too long', () => {
    const invalidData = { ...validInput, state: 'SPO' }; // 3 chars
    const result = auctionFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['state']);
    }
  });

});

console.log('Arquivo de teste src/app/admin/auctions/auction-form-schema.test.ts criado/atualizado.');
