/**
 * @fileoverview API de filtros salvos do SuperGrid.
 * Expõe leitura, gravação e remoção para componentes client sem importar server actions.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  deleteGridFilterForCurrentUser,
  getSavedGridFiltersForCurrentUser,
  saveGridFilterForCurrentUser,
} from '@/server/services/grid-preferences.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const gridId = request.nextUrl.searchParams.get('gridId') ?? '';
    const savedFilters = await getSavedGridFiltersForCurrentUser(gridId);

    return NextResponse.json({ data: savedFilters });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível carregar os filtros salvos.';
    const status = message === 'Usuário não autenticado.' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const savedFilter = await saveGridFilterForCurrentUser(body);

    return NextResponse.json({ data: savedFilter });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível salvar o filtro.';
    const status = message === 'Usuário não autenticado.' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    await deleteGridFilterForCurrentUser(body);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível excluir o filtro.';
    const status = message === 'Usuário não autenticado.' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}