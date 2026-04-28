# Admin Auction Sale Modes Specification

## ADDED Requirements

### Requirement: Persist Auction Sale Modes

BidExpert SHALL persist auction-level sale-mode controls for sublots, per-lot enrollment, preference rights, proposal acceptance, direct sale, and proposal deadline.

#### Scenario: Save proposal-enabled sale modes

- **GIVEN** an admin is editing an auction
- **WHEN** the admin enables proposals and informs a proposal deadline
- **THEN** the auction persists proposal acceptance as enabled
- **AND** the proposal deadline is saved with the auction
- **AND** the saved values are shown again when the auction form is reopened

#### Scenario: Require deadline when proposals are enabled

- **GIVEN** an admin is editing sale modes
- **WHEN** proposals are enabled without a proposal deadline
- **THEN** the form blocks submission
- **AND** the proposal deadline field receives a clear validation message

### Requirement: Keep Classic and V2 Forms Equivalent

The classic auction form and V2 auction form SHALL expose the same persisted sale-mode contract and use the same labels for equivalent controls.

#### Scenario: Sale modes are available in both forms

- **GIVEN** the classic and V2 auction forms are available
- **WHEN** an admin opens the options section
- **THEN** both forms show controls for Permitir Sublote, Habilitacao por Lote, Direito de Preferencia, Permitir Propostas, Venda Direta, and Data Limite para Propostas