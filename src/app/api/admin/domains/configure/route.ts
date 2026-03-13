
/**
 * @fileoverview Endpoint legado de configuração de domínios.
 * O projeto usa Vercel como plataforma de hosting; portanto o fluxo antigo
 * baseado em Firebase App Hosting foi desativado para evitar provisionamento
 * no provider incorreto.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { domain } = await req.json();

        if (!domain) {
            return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
        }

        return NextResponse.json(
            {
                success: false,
                domain,
                provider: 'vercel',
                error: 'Automatic domain provisioning via Firebase App Hosting was disabled.',
                message: 'BidExpert now uses Vercel for hosting. Configure domains in the Vercel dashboard or replace this endpoint with a Vercel Domains API implementation.'
            },
            { status: 501 }
        );

    } catch (error: any) {
        console.error('[Domain Setup] Critical Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
