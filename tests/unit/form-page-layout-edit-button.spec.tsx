/**
 * @fileoverview Testa que o botão "Entrar em Modo de Edição" do FormPageLayout
 * está sempre acessível (não bloqueado pelo fieldset disabled) tanto na toolbar
 * desktop (fora do fieldset) quanto na toolbar mobile (fora do fieldset após correção).
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FormPageLayout from '@/components/admin/form-page-layout';

describe('FormPageLayout – botão de edição geral do leilão', () => {
  it('renderiza o botão "Entrar em Modo de Edição" em modo de visualização (isViewMode=true)', () => {
    const onEnterEditMode = vi.fn();

    render(
      <FormPageLayout
        formTitle="Visualizar Leilão"
        formDescription="Leilão Teste"
        isViewMode={true}
        onEnterEditMode={onEnterEditMode}
      >
        <input data-testid="form-field" />
      </FormPageLayout>
    );

    const editButtons = document.querySelectorAll('[data-ai-id="form-page-btn-edit-mode"]');
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('chama onEnterEditMode ao clicar no botão – toolbar acessível mesmo com fieldset disabled', () => {
    const onEnterEditMode = vi.fn();

    render(
      <FormPageLayout
        formTitle="Visualizar Leilão"
        formDescription="Leilão Teste"
        isViewMode={true}
        onEnterEditMode={onEnterEditMode}
      >
        <input data-testid="form-field" />
      </FormPageLayout>
    );

    const editButtons = document.querySelectorAll<HTMLButtonElement>('[data-ai-id="form-page-btn-edit-mode"]');

    editButtons.forEach((btn) => {
      // Nenhum dos botões deve estar desabilitado
      expect(btn.disabled).toBe(false);
    });

    // Clicar em qualquer um dos botões deve chamar o handler
    fireEvent.click(editButtons[0]);
    expect(onEnterEditMode).toHaveBeenCalledTimes(1);
  });

  it('o campo do formulário é desabilitado em modo de visualização (fieldset disabled funciona)', () => {
    render(
      <FormPageLayout
        formTitle="Visualizar Leilão"
        formDescription="Leilão Teste"
        isViewMode={true}
        onEnterEditMode={vi.fn()}
      >
        <input data-testid="form-field" />
      </FormPageLayout>
    );

    const formField = screen.getByTestId('form-field');
    expect(formField).toBeDisabled();
  });

  it('exibe o botão Salvar (não o botão de edição) quando isViewMode=false', () => {
    const onSave = vi.fn();

    render(
      <FormPageLayout
        formTitle="Editar Leilão"
        formDescription="Leilão Teste"
        isViewMode={false}
        onSave={onSave}
      >
        <input data-testid="form-field" />
      </FormPageLayout>
    );

    // Deve mostrar o botão de salvar
    const saveButtons = document.querySelectorAll('[data-ai-id="form-page-btn-save"]');
    expect(saveButtons.length).toBeGreaterThan(0);

    // Não deve mostrar o botão "Entrar em Modo de Edição"
    const editButtons = document.querySelectorAll('[data-ai-id="form-page-btn-edit-mode"]');
    expect(editButtons.length).toBe(0);
  });
});
