import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('[GET /api/public/tenants] Failed to fetch tenants', error);
    return NextResponse.json(
      { message: 'Não foi possível carregar a lista de espaços de trabalho.' },
      { status: 500 },
    );
  }
}
