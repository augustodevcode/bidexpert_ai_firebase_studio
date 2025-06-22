import { auctioneerFormSchema, AuctioneerFormValues } from './auctioneer-form-schema';

describe('auctioneerFormSchema', () => {
  const validInput: AuctioneerFormValues = {
    name: 'João Leiloeiro Experiente',
    registrationNumber: 'JUCESP/12345',
    contactName: 'Carlos Contato',
    email: 'joao.leiloeiro@example.com',
    phone: '1122334455',
    address: 'Rua dos Leilões, 789, Sala 10',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01000-000',
    website: 'https://joaoleiloeiro.example.com',
    logoUrl: 'https://joaoleiloeiro.example.com/logo.png',
    dataAiHintLogo: 'logo leiloeiro oficial',
    description: 'Leiloeiro com mais de 20 anos de experiência no mercado.',
    userId: 'user_xyz_789',
  };

  it('should validate with correct data', () => {
    const result = auctioneerFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  // Testes para name
  it('should fail if name is too short', () => {
    const invalidData = { ...validInput, name: 'Jo' };
    const result = auctioneerFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['name']);
      expect(result.error.issues[0].message).toBe('O nome do leiloeiro deve ter pelo menos 3 caracteres.');
    }
  });

  it('should fail if name is too long', () => {
    const invalidData = { ...validInput, name: 'N'.repeat(151) };
    const result = auctioneerFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['name']);
      expect(result.error.issues[0].message).toBe('O nome do leiloeiro não pode exceder 150 caracteres.');
    }
  });

  // Testes para registrationNumber
  it('should fail if registrationNumber is too long', () => {
    const invalidData = { ...validInput, registrationNumber: 'R'.repeat(51) };
    const result = auctioneerFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['registrationNumber']);
    }
  });

  it('should pass if registrationNumber is null (optional nullable)', () => {
    const data = { ...validInput, registrationNumber: null };
    const result = auctioneerFormSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  // Testes para email
  it('should fail if email is invalid', () => {
    const invalidData = { ...validInput, email: 'invalid-email' };
    const result = auctioneerFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['email']);
      expect(result.error.issues[0].message).toBe('Formato de email inválido.');
    }
  });

  it('should pass if email is an empty string (optional or literal)', () => {
    const dataWithEmptyEmail = { ...validInput, email: '' };
    const result = auctioneerFormSchema.safeParse(dataWithEmptyEmail);
    expect(result.success).toBe(true);
  });

  it('should pass if email is null (optional nullable)', () => {
    const dataWithNullEmail = { ...validInput, email: null };
    const result = auctioneerFormSchema.safeParse(dataWithNullEmail);
    expect(result.success).toBe(true);
  });

  // Testes para website
  it('should fail if website is an invalid URL', () => {
    const invalidData = { ...validInput, website: 'not_a_url' };
    const result = auctioneerFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['website']);
      expect(result.error.issues[0].message).toBe('URL do website inválida.');
    }
  });

  it('should pass if website is an empty string (optional or literal)', () => {
    const data = { ...validInput, website: '' };
    const result = auctioneerFormSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  // Testes para logoUrl
  it('should fail if logoUrl is an invalid URL', () => {
    const invalidData = { ...validInput, logoUrl: 'invalid_logo_url' };
    const result = auctioneerFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['logoUrl']);
      expect(result.error.issues[0].message).toBe('URL do logo inválida.');
    }
  });

  // Testes para dataAiHintLogo
  it('should fail if dataAiHintLogo is too long', () => {
    const invalidData = { ...validInput, dataAiHintLogo: 'H'.repeat(51) };
    const result = auctioneerFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['dataAiHintLogo']);
      expect(result.error.issues[0].message).toBe('Dica de IA para logo não pode exceder 50 caracteres.');
    }
  });

  // Testes para description
  it('should fail if description is too long', () => {
    const invalidData = { ...validInput, description: 'D'.repeat(2001) };
    const result = auctioneerFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['description']);
    }
  });

  it('should pass if all optional fields are not provided', () => {
    const minimalInput: AuctioneerFormValues = { name: 'Leiloeiro Simples' };
    const result = auctioneerFormSchema.safeParse(minimalInput);
    expect(result.success).toBe(true);
  });
});

console.log('Arquivo de teste src/app/admin/auctioneers/auctioneer-form-schema.test.ts criado/atualizado.');
