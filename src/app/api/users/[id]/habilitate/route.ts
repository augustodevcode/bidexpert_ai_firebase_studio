/**
 * @fileoverview API Route for user habilitation
 * @description PATCH /api/users/[id]/habilitate - Enable/disable user for bidding
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/users/[id]/habilitate - Enable or disable user for bidding
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { enabled = true } = body;

    // Find user by ID, publicId, or email
    let user;
    const numericId = parseInt(id);
    
    if (!isNaN(numericId)) {
      user = await prisma.user.findUnique({
        where: { id: numericId }
      });
    }
    
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { publicId: id },
            { email: id }
          ]
        }
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: enabled,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        publicId: updatedUser.publicId,
        email: updatedUser.email,
        name: updatedUser.name,
        isActive: updatedUser.isActive,
        role: updatedUser.role
      },
      message: `User ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error: unknown) {
    console.error('[API User Habilitate] Error updating user:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/[id]/habilitate - Check user habilitation status
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Find user by ID, publicId, or email
    let user;
    const numericId = parseInt(id);
    
    if (!isNaN(numericId)) {
      user = await prisma.user.findUnique({
        where: { id: numericId }
      });
    }
    
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { publicId: id },
            { email: id }
          ]
        }
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        publicId: user.publicId,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        role: user.role,
        isEnabled: user.isActive
      }
    });
  } catch (error: unknown) {
    console.error('[API User Habilitate] Error checking user:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
