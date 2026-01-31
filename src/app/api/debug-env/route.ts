
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcryptjs from 'bcryptjs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || 'admin@bidexpert.ai';
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenants: true }
  });

  let passwordCheck = 'Skipped';
  if (user) {
       const isValid = await bcryptjs.compare('senha@123', user.password || '');
       passwordCheck = isValid ? 'VALID' : 'INVALID';
  }

  return NextResponse.json({
    env: {
        NODE_ENV: process.env.NODE_ENV,
        // Mask the password part of the DB URL
        DATABASE_URL: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@') : 'UNDEFINED'
    },
    userFound: !!user,
    userData: user ? {
        id: user.id.toString(),
        email: user.email,
        passwordHashPrefix: user.password?.substring(0, 10),
        tenants: user.tenants.map(t => ({ tenantId: t.tenantId.toString(), assignedBy: t.assignedBy }))
    } : null,
    passwordAuthCheck_senha123: passwordCheck
  });
}
