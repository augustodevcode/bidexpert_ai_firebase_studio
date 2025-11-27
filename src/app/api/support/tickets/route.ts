import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      category,
      priority,
      userId,
      userSnapshot,
      userAgent,
      browserInfo,
      screenSize,
      pageUrl,
    } = body;

    // Generate unique ticket ID
    const timestamp = Date.now();
    const publicId = `TICKET-${timestamp}`;

    // Create ticket
    const ticket = await prisma.iTSM_Ticket.create({
      data: {
        publicId,
        userId: BigInt(userId),
        title,
        description,
        category,
        priority,
        status: 'ABERTO',
        userSnapshot,
        userAgent,
        browserInfo,
        screenSize,
        pageUrl,
        errorLogs: null,
      },
    });

    // Create initial message
    await prisma.iTSM_Message.create({
      data: {
        ticketId: ticket.id,
        userId: BigInt(userId),
        message: description,
        isInternal: false,
      },
    });

    return NextResponse.json({ 
      success: true, 
      ticketId: ticket.publicId,
      message: 'Ticket criado com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao criar ticket:', error);
    return NextResponse.json({ error: 'Erro ao criar ticket' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    const where: any = {};
    
    if (userId) {
      where.userId = BigInt(userId);
    }
    
    if (status) {
      where.status = status;
    }

    const tickets = await prisma.iTSM_Ticket.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Convert BigInt to string for JSON serialization
    const serializedTickets = tickets.map(ticket => ({
      ...ticket,
      id: ticket.id.toString(),
      userId: ticket.userId.toString(),
      assignedToUserId: ticket.assignedToUserId?.toString() || null,
      messages: ticket.messages.map(msg => ({
        ...msg,
        id: msg.id.toString(),
        ticketId: msg.ticketId.toString(),
        userId: msg.userId.toString(),
      })),
    }));

    return NextResponse.json({ tickets: serializedTickets });
  } catch (error) {
    console.error('Erro ao buscar tickets:', error);
    return NextResponse.json({ error: 'Erro ao buscar tickets' }, { status: 500 });
  }
}
