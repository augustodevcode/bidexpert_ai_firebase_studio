import { stateFormSchema, StateFormValues } from './state-form-schema';

describe('stateFormSchema', () => {
  const validInput: StateFormValues = {
    name: 'Paraná',
    uf: 'PR',
  };

  it('should validate with correct data', () => {
    const result = stateFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Paraná');
      expect(result.data.uf).toBe('PR');
    }
  });

  // Testes para name
  it('should fail if name is too short', () => {
    const invalidData = { ...validInput, name: 'Pa' };
    const result = stateFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['name']);
      expect(result.error.issues[0].message).toBe('O nome do estado deve ter pelo menos 3 caracteres.');
    }
  });

  it('should fail if name is too long', () => {
    const invalidData = { ...validInput, name: 'N'.repeat(101) };
    const result = stateFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['name']);
      expect(result.error.issues[0].message).toBe('O nome do estado não pode exceder 100 caracteres.');
    }
  });

  it('should fail if name is empty', () => {
    const invalidData = { ...validInput, name: '' };
    const result = stateFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['name']);
    }
  });

  // Testes para uf
  it('should fail if uf is too short', () => {
    const invalidData = { ...validInput, uf: 'P' };
    const result = stateFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['uf']);
      expect(result.error.issues[0].message).toBe('A UF deve ter exatamente 2 caracteres.');
    }
  });

  it('should fail if uf is too long', () => {
    const invalidData = { ...validInput, uf: 'PRN' };
    const result = stateFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['uf']);
      expect(result.error.issues[0].message).toBe('A UF deve ter exatamente 2 caracteres.');
    }
  });

  it('should fail if uf is empty', () => {
    const invalidData = { ...validInput, uf: '' };
    const result = stateFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['uf']);
      // A mensagem pode variar dependendo de qual validação (length ou regex) falha primeiro para string vazia.
      // O importante é que falhe.
    }
  });

  it('should fail if uf contains lowercase letters', () => {
    const invalidData = { ...validInput, uf: 'Pr' };
    const result = stateFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['uf']);
      expect(result.error.issues[0].message).toBe('A UF deve conter apenas letras maiúsculas.');
    }
  });

  it('should fail if uf contains numbers', () => {
    const invalidData = { ...validInput, uf: 'P1' };
    const result = stateFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['uf']);
      expect(result.error.issues[0].message).toBe('A UF deve conter apenas letras maiúsculas.');
    }
  });

  it('should fail if uf contains special characters', () => {
    const invalidData = { ...validInput, uf: 'P!' };
    const result = stateFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['uf']);
      expect(result.error.issues[0].message).toBe('A UF deve conter apenas letras maiúsculas.');
    }
  });
});

console.log('Arquivo de teste src/app/admin/states/state-form-schema.test.ts criado/atualizado.');
