import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    const ticket = await prisma.iTSM_Ticket.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            cellPhone: true,
          },
        },
        attachments: true,
        messages: {
            include: {
                user: {
                    select: { fullName: true, email: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 });
    }

    // Serialization
    const serializedTicket = {
      ...ticket,
      id: ticket.id.toString(),
      userId: ticket.userId.toString(),
      assignedToUserId: ticket.assignedToUserId?.toString() || null,
      tenantId: ticket.tenantId?.toString() || null,
      attachments: ticket.attachments.map(att => ({
        ...att,
        id: att.id.toString(),
        ticketId: att.ticketId.toString(),
        uploadedBy: att.uploadedBy.toString(),
      })),
      messages: ticket.messages.map(msg => ({
        ...msg,
        id: msg.id.toString(),
        ticketId: msg.ticketId.toString(),
        userId: msg.userId.toString(),
      }))
    };

    return NextResponse.json({ ticket: serializedTicket });

  } catch (error) {
    console.error('Erro ao buscar ticket:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
    const { status, priority } = await req.json();

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    const ticket = await prisma.iTSM_Ticket.update({
        where: { id: BigInt(id) },
        data: updateData
    });

    return NextResponse.json({ success: true, ticket });

  } catch(error) {
      console.error('Erro ao atualizar ticket:', error);
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
