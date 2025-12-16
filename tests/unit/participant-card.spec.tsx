/**
 * @file participant-card.spec.tsx
 * @description Testes unitários para o componente ParticipantCard
 * 
 * BDD:
 * Feature: Exibição de cards de participantes no cadastro de leilões
 *   Como um administrador do sistema
 *   Eu quero ver cards com informações detalhadas dos participantes selecionados
 *   Para ter uma visão clara de quem está envolvido no leilão
 * 
 *   Scenario: Exibir card de leiloeiro selecionado
 *     Given que um leiloeiro foi selecionado no formulário
 *     When o card é renderizado
 *     Then deve exibir o nome, logo e dados de contato do leiloeiro
 *     And deve ter um badge identificando como "Leiloeiro"
 * 
 *   Scenario: Exibir card de comitente selecionado
 *     Given que um comitente foi selecionado no formulário
 *     When o card é renderizado
 *     Then deve exibir o nome, logo e dados de contato do comitente
 *     And deve ter um badge identificando como "Comitente"
 * 
 *   Scenario: Exibir card de processo judicial selecionado
 *     Given que um processo judicial foi selecionado no formulário
 *     When o card é renderizado
 *     Then deve exibir o número do processo e dados do tribunal
 *     And deve ter um badge identificando como "Processo Judicial"
 * 
 *   Scenario: Remover participante do card
 *     Given que um participante está selecionado
 *     When clico no botão de remover
 *     Then o callback onRemove deve ser chamado
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ParticipantCard, type ParticipantCardData } from '@/components/admin/participant-card';

describe('ParticipantCard', () => {
  const mockAuctioneerData: ParticipantCardData = {
    id: '1',
    name: 'Leiloeiro Oficial João Silva',
    logoUrl: 'https://example.com/logo.jpg',
    email: 'joao@leiloeiro.com',
    phone: '(11) 99999-9999',
    city: 'São Paulo',
    state: 'SP',
    registrationNumber: 'JUCESP-123456',
    website: 'https://leiloeiro.com',
  };

  const mockSellerData: ParticipantCardData = {
    id: '2',
    name: 'Banco ABC S.A.',
    logoUrl: 'https://example.com/banco-logo.jpg',
    email: 'contato@banco.com',
    phone: '(11) 3333-3333',
    city: 'Rio de Janeiro',
    state: 'RJ',
  };

  const mockProcessData: ParticipantCardData = {
    id: '3',
    name: '0098765-43.2024.8.26.0100',
    processNumber: '0098765-43.2024.8.26.0100',
    courtName: 'TJSP',
    branchName: '10ª Vara Cível - Fórum Central',
    isElectronic: true,
  };

  describe('Auctioneer Card', () => {
    it('renders auctioneer card with correct badge', () => {
      render(
        <ParticipantCard type="auctioneer" data={mockAuctioneerData} />
      );

      expect(screen.getByTestId('participant-card-auctioneer')).toBeInTheDocument();
      expect(screen.getByText('Leiloeiro')).toBeInTheDocument();
    });

    it('displays auctioneer name', () => {
      render(
        <ParticipantCard type="auctioneer" data={mockAuctioneerData} />
      );

      expect(screen.getByText('Leiloeiro Oficial João Silva')).toBeInTheDocument();
    });

    it('displays auctioneer registration number', () => {
      render(
        <ParticipantCard type="auctioneer" data={mockAuctioneerData} />
      );

      expect(screen.getByText(/Reg: JUCESP-123456/i)).toBeInTheDocument();
    });

    it('displays auctioneer contact information', () => {
      render(
        <ParticipantCard type="auctioneer" data={mockAuctioneerData} />
      );

      expect(screen.getByText('joao@leiloeiro.com')).toBeInTheDocument();
      expect(screen.getByText('(11) 99999-9999')).toBeInTheDocument();
    });

    it('displays auctioneer location', () => {
      render(
        <ParticipantCard type="auctioneer" data={mockAuctioneerData} />
      );

      expect(screen.getByText('São Paulo, SP')).toBeInTheDocument();
    });

    it('renders avatar with initials when no logo', () => {
      const dataWithoutLogo = { ...mockAuctioneerData, logoUrl: null };
      render(
        <ParticipantCard type="auctioneer" data={dataWithoutLogo} />
      );

      // Should show initials "LO" for "Leiloeiro Oficial"
      expect(screen.getByText('LO')).toBeInTheDocument();
    });
  });

  describe('Seller Card', () => {
    it('renders seller card with correct badge', () => {
      render(
        <ParticipantCard type="seller" data={mockSellerData} />
      );

      expect(screen.getByTestId('participant-card-seller')).toBeInTheDocument();
      expect(screen.getByText('Comitente')).toBeInTheDocument();
    });

    it('displays seller name and contact info', () => {
      render(
        <ParticipantCard type="seller" data={mockSellerData} />
      );

      expect(screen.getByText('Banco ABC S.A.')).toBeInTheDocument();
      expect(screen.getByText('contato@banco.com')).toBeInTheDocument();
      expect(screen.getByText('(11) 3333-3333')).toBeInTheDocument();
      expect(screen.getByText('Rio de Janeiro, RJ')).toBeInTheDocument();
    });

    it('renders avatar with initials', () => {
      const dataWithoutLogo = { ...mockSellerData, logoUrl: null };
      render(
        <ParticipantCard type="seller" data={dataWithoutLogo} />
      );

      // Should show initials "BA" for "Banco ABC"
      expect(screen.getByText('BA')).toBeInTheDocument();
    });
  });

  describe('Judicial Process Card', () => {
    it('renders judicial process card with correct badge', () => {
      render(
        <ParticipantCard type="judicialProcess" data={mockProcessData} />
      );

      expect(screen.getByTestId('participant-card-judicialProcess')).toBeInTheDocument();
      expect(screen.getByText('Processo Judicial')).toBeInTheDocument();
    });

    it('displays process number', () => {
      render(
        <ParticipantCard type="judicialProcess" data={mockProcessData} />
      );

      expect(screen.getByText('0098765-43.2024.8.26.0100')).toBeInTheDocument();
    });

    it('displays court information', () => {
      render(
        <ParticipantCard type="judicialProcess" data={mockProcessData} />
      );

      expect(screen.getByText('TJSP')).toBeInTheDocument();
      expect(screen.getByText('10ª Vara Cível - Fórum Central')).toBeInTheDocument();
    });

    it('displays electronic process badge', () => {
      render(
        <ParticipantCard type="judicialProcess" data={mockProcessData} />
      );

      expect(screen.getByText('Eletrônico')).toBeInTheDocument();
    });

    it('displays physical process badge when not electronic', () => {
      const physicalProcess = { ...mockProcessData, isElectronic: false };
      render(
        <ParticipantCard type="judicialProcess" data={physicalProcess} />
      );

      expect(screen.getByText('Físico')).toBeInTheDocument();
    });

    it('renders icon instead of avatar for process', () => {
      render(
        <ParticipantCard type="judicialProcess" data={mockProcessData} />
      );

      // Process cards should not have an avatar, but an icon
      const card = screen.getByTestId('participant-card-judicialProcess');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Remove Functionality', () => {
    it('calls onRemove when remove button is clicked', () => {
      const onRemove = vi.fn();
      render(
        <ParticipantCard 
          type="auctioneer" 
          data={mockAuctioneerData} 
          onRemove={onRemove} 
        />
      );

      const removeButton = screen.getByRole('button', { name: /remover leiloeiro/i });
      fireEvent.click(removeButton);

      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('does not show remove button when onRemove is not provided', () => {
      render(
        <ParticipantCard type="auctioneer" data={mockAuctioneerData} />
      );

      expect(screen.queryByRole('button', { name: /remover/i })).not.toBeInTheDocument();
    });
  });

  describe('Null Data Handling', () => {
    it('returns null when data is null', () => {
      const { container } = render(
        <ParticipantCard type="auctioneer" data={null} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(
        <ParticipantCard 
          type="auctioneer" 
          data={mockAuctioneerData} 
          className="custom-class" 
        />
      );

      const card = screen.getByTestId('participant-card-auctioneer');
      expect(card).toHaveClass('custom-class');
    });
  });
});
