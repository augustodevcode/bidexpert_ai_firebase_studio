import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Convert BigInt to string for JSON serialization
    const serializedTenants = tenants.map(tenant => ({
      id: tenant.id.toString(),
      name: tenant.name,
      subdomain: tenant.subdomain,
    }));

    return NextResponse.json({ tenants: serializedTenants });
  } catch (error) {
    console.error('[GET /api/public/tenants] Failed to fetch tenants', error);
    return NextResponse.json(
      { message: 'Não foi possível carregar a lista de espaços de trabalho.' },
      { status: 500 },
    );
  }
}
