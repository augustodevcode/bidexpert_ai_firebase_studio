/**
 * @fileoverview Testes unitários das regras puras da fixture de pregão multi-perfil.
 */

import { describe, expect, it } from 'vitest';

import {
  PREGAO_BID_INCREMENT,
  PREGAO_BUYER_COUNT,
  PREGAO_INITIAL_PRICE,
  buildPregaoActorMatrix,
  buildPregaoBidSchedule,
  groupPregaoScheduleByRound,
  resolvePregaoWinner,
} from '../e2e/helpers/pregao-multiperfil-fixture';

describe('pregao-multiperfil fixture helpers', () => {
  it('cria 10 compradores independentes sem papel de administrador', () => {
    const matrix = buildPregaoActorMatrix('unit-run');

    expect(matrix.buyers).toHaveLength(PREGAO_BUYER_COUNT);
    expect(new Set(matrix.buyers.map((buyer) => buyer.email)).size).toBe(PREGAO_BUYER_COUNT);
    expect(matrix.buyers.every((buyer) => buyer.roles.includes('COMPRADOR'))).toBe(true);
    expect(matrix.buyers.some((buyer) => buyer.roles.includes('ADMIN'))).toBe(false);
  });

  it('calcula vencedor pelo maior lance planejado', () => {
    const matrix = buildPregaoActorMatrix('unit-run');
    const schedule = buildPregaoBidSchedule(matrix.buyers, { runId: 'unit-run', rounds: 2 });
    const winner = resolvePregaoWinner(schedule);

    expect(schedule).toHaveLength(PREGAO_BUYER_COUNT * 2);
    expect(winner.buyerNumber).toBe(PREGAO_BUYER_COUNT);
    expect(winner.amount).toBe(PREGAO_INITIAL_PRICE + PREGAO_BID_INCREMENT * PREGAO_BUYER_COUNT * 2);
  });

  it('agrupa a disputa por rodadas completas de compradores', () => {
    const matrix = buildPregaoActorMatrix('unit-run');
    const schedule = buildPregaoBidSchedule(matrix.buyers, { runId: 'unit-run', rounds: 3 });
    const groups = groupPregaoScheduleByRound(schedule);

    expect(groups).toHaveLength(3);
    expect(groups.every((group) => group.length === PREGAO_BUYER_COUNT)).toBe(true);
  });
});
