import { sellerFormSchema, SellerFormValues } from './seller-form-schema';

describe('sellerFormSchema', () => {
  const validInput: SellerFormValues = {
    name: 'Vendedor Confiável Ltda.',
    contactName: 'Ana Contato Vendas',
    email: 'contato@vendedorconfiavel.com.br',
    phone: '4133225566',
    address: 'Avenida das Oportunidades, 1000',
    city: 'Curitiba',
    state: 'PR',
    zipCode: '80000-000',
    website: 'https://vendedorconfiavel.com.br',
    logoUrl: 'https://vendedorconfiavel.com.br/logo.png',
    dataAiHintLogo: 'logo empresa vendas',
    description: 'Empresa especializada em venda de ativos diversos.',
  };

  it('should validate with correct data', () => {
    const result = sellerFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  // Testes para name
  it('should fail if name is too short', () => {
    const invalidData = { ...validInput, name: 'V' };
    const result = sellerFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['name']);
      expect(result.error.issues[0].message).toBe('O nome do comitente deve ter pelo menos 3 caracteres.');
    }
  });

  it('should fail if name is too long', () => {
    const invalidData = { ...validInput, name: 'V'.repeat(151) };
    const result = sellerFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['name']);
    }
  });

  // Testes para email
  it('should fail if email is invalid', () => {
    const invalidData = { ...validInput, email: 'contato-vendedorconfiavel' };
    const result = sellerFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['email']);
      expect(result.error.issues[0].message).toBe('Formato de email inválido.');
    }
  });

  it('should pass if email is an empty string (optional or literal)', () => {
    const dataWithEmptyEmail = { ...validInput, email: '' };
    const result = sellerFormSchema.safeParse(dataWithEmptyEmail);
    expect(result.success).toBe(true);
  });

  it('should pass if email is not provided (optional)', () => {
    const dataWithoutEmail = { ...validInput };
    delete dataWithoutEmail.email;
    const result = sellerFormSchema.safeParse(dataWithoutEmail);
    expect(result.success).toBe(true);
  });


  // Testes para website
  it('should fail if website is an invalid URL', () => {
    const invalidData = { ...validInput, website: 'htp:/invalid' };
    const result = sellerFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['website']);
      expect(result.error.issues[0].message).toBe('URL do website inválida.');
    }
  });

  it('should pass if website is an empty string (optional or literal)', () => {
    const data = { ...validInput, website: '' };
    const result = sellerFormSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  // Testes para logoUrl
  it('should fail if logoUrl is an invalid URL', () => {
    const invalidData = { ...validInput, logoUrl: 'logo-url-invalida' };
    const result = sellerFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['logoUrl']);
    }
  });

  it('should pass if logoUrl is an empty string (optional or literal)', () => {
    const data = { ...validInput, logoUrl: '' };
    const result = sellerFormSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  // Testes para dataAiHintLogo
  it('should fail if dataAiHintLogo is too long', () => {
    const invalidData = { ...validInput, dataAiHintLogo: 'L'.repeat(51) };
    const result = sellerFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['dataAiHintLogo']);
      expect(result.error.issues[0].message).toBe('Dica de IA para logo não pode exceder 50 caracteres.');
    }
  });

  // Testes para description
  it('should fail if description is too long', () => {
    const invalidData = { ...validInput, description: 'D'.repeat(2001) };
    const result = sellerFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['description']);
    }
  });

  it('should pass if all optional fields are not provided', () => {
    const minimalInput: SellerFormValues = { name: 'Comitente Teste' };
    const result = sellerFormSchema.safeParse(minimalInput);
    expect(result.success).toBe(true);
  });
});

console.log('Arquivo de teste src/app/admin/sellers/seller-form-schema.test.ts criado/atualizado.');
