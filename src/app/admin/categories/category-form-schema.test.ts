import { categoryFormSchema, CategoryFormValues } from './category-form-schema';

describe('categoryFormSchema', () => {
  const validInput: CategoryFormValues = {
    name: 'Veículos Leves',
    description: 'Carros de passeio, motocicletas e pequenos utilitários.',
  };

  it('should validate with correct data', () => {
    const result = categoryFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Veículos Leves');
    }
  });

  // Testes para name
  it('should fail if name is too short', () => {
    const invalidData = { ...validInput, name: 'V' };
    const result = categoryFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['name']);
      expect(result.error.issues[0].message).toBe('O nome da categoria deve ter pelo menos 2 caracteres.');
    }
  });

  it('should fail if name is too long', () => {
    const invalidData = { ...validInput, name: 'C'.repeat(101) };
    const result = categoryFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['name']);
      expect(result.error.issues[0].message).toBe('O nome da categoria não pode exceder 100 caracteres.');
    }
  });

  it('should fail if name is empty', () => {
    const invalidData = { ...validInput, name: '' };
    const result = categoryFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
        // Zod's min(2) will catch this before a general "required" error for empty strings.
      expect(result.error.issues[0].path).toEqual(['name']);
    }
  });

  // Testes para description
  it('should fail if description is too long', () => {
    const invalidData = { ...validInput, description: 'D'.repeat(501) };
    const result = categoryFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['description']);
      expect(result.error.issues[0].message).toBe('A descrição não pode exceder 500 caracteres.');
    }
  });

  it('should pass if description is not provided (optional)', () => {
    const dataWithoutDescription: CategoryFormValues = { name: 'Imóveis' };
    const result = categoryFormSchema.safeParse(dataWithoutDescription);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });

  it('should pass if description is an empty string (optional behavior with Zod strings)', () => {
    const dataWithEmptyDescription: CategoryFormValues = { name: 'Artefatos', description: '' };
    const result = categoryFormSchema.safeParse(dataWithEmptyDescription);
    expect(result.success).toBe(true);
     if (result.success) {
      expect(result.data.description).toBe(''); // Zod keeps empty string if not further constrained by .min(1) for optional fields
    }
  });
});

console.log('Arquivo de teste src/app/admin/categories/category-form-schema.test.ts criado/atualizado.');
