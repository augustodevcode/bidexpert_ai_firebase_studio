import { cityFormSchema, CityFormValues } from './city-form-schema';

describe('cityFormSchema', () => {
  const validInput: CityFormValues = {
    name: 'Curitiba',
    stateId: 'PR', // ou um ID numérico, dependendo da implementação
    ibgeCode: '4106902',
  };

  it('should validate with correct data', () => {
    const result = cityFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Curitiba');
      expect(result.data.stateId).toBe('PR');
      expect(result.data.ibgeCode).toBe('4106902');
    }
  });

  it('should pass if ibgeCode is an empty string (optional or literal)', () => {
    const dataWithEmptyIbge = { ...validInput, ibgeCode: '' };
    const result = cityFormSchema.safeParse(dataWithEmptyIbge);
    expect(result.success).toBe(true);
  });

  it('should pass if ibgeCode is not provided (optional)', () => {
    const dataWithoutIbge = { ...validInput };
    delete dataWithoutIbge.ibgeCode;
    const result = cityFormSchema.safeParse(dataWithoutIbge);
    expect(result.success).toBe(true);
  });

  // Testes para name
  it('should fail if name is too short', () => {
    const invalidData = { ...validInput, name: 'C' };
    const result = cityFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['name']);
      expect(result.error.issues[0].message).toBe('O nome da cidade deve ter pelo menos 2 caracteres.');
    }
  });

  it('should fail if name is too long', () => {
    const invalidData = { ...validInput, name: 'C'.repeat(151) };
    const result = cityFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['name']);
      expect(result.error.issues[0].message).toBe('O nome da cidade não pode exceder 150 caracteres.');
    }
  });

  it('should fail if name is empty', () => {
    const invalidData = { ...validInput, name: '' };
    const result = cityFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['name']);
    }
  });

  // Testes para stateId
  it('should fail if stateId is empty', () => {
    const invalidData = { ...validInput, stateId: '' };
    const result = cityFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['stateId']);
      expect(result.error.issues[0].message).toBe('Por favor, selecione um estado.');
    }
  });

  // Testes para ibgeCode
  it('should fail if ibgeCode has incorrect length (shorter)', () => {
    const invalidData = { ...validInput, ibgeCode: '123456' }; // 6 dígitos
    const result = cityFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['ibgeCode']);
      expect(result.error.issues[0].message).toBe('O código IBGE da cidade deve ter 7 dígitos.');
    }
  });

  it('should fail if ibgeCode has incorrect length (longer)', () => {
    const invalidData = { ...validInput, ibgeCode: '12345678' }; // 8 dígitos
    const result = cityFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['ibgeCode']);
      expect(result.error.issues[0].message).toBe('O código IBGE da cidade deve ter 7 dígitos.');
    }
  });

  it('should fail if ibgeCode contains non-digits', () => {
    const invalidData = { ...validInput, ibgeCode: '123456A' };
    const result = cityFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['ibgeCode']);
      expect(result.error.issues[0].message).toBe('O código IBGE deve conter apenas números.');
    }
  });
});

console.log('Arquivo de teste src/app/admin/cities/city-form-schema.test.ts criado/atualizado.');
