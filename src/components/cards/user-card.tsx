// src/components/cards/user-card.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { UserProfileWithPermissions } from '@/types';
import { Eye, Edit, Mail, Phone, Calendar, ShieldCheck, UserCog } from 'lucide-react';
import { getUserHabilitationStatusInfo } from '@/lib/ui-helpers';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserCardProps {
  user: UserProfileWithPermissions;
  onUpdate?: () => void;
}

export default function UserCard({ user, onUpdate }: UserCardProps) {
  const userInitial = user.fullName ? user.fullName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');
  const habilitationInfo = getUserHabilitationStatusInfo(user.habilitationStatus);
  const HabilitationIcon = habilitationInfo.icon;

  return (
    <Card className="flex flex-col overflow-hidden h-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group">
      <CardHeader className="text-center p-4 bg-secondary/30">
        <Avatar className="h-20 w-20 mx-auto mb-3 border-2">
          <AvatarImage src={user.avatarUrl || ''} alt={user.fullName || 'Avatar do usuário'} data-ai-hint="avatar usuario"/>
          <AvatarFallback className="text-3xl">{userInitial}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-lg font-semibold truncate">{user.fullName || user.email}</CardTitle>
        <CardDescription className="text-xs">{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 flex-grow space-y-2 text-sm">
        <div className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-wrap gap-1">
                {(user.roleNames || ['Usuário']).map(role => (
                    <Badge key={role} variant="secondary">{role}</Badge>
                ))}
            </div>
        </div>
        <div className="flex items-center gap-2">
            <HabilitationIcon className={`h-4 w-4 flex-shrink-0 ${habilitationInfo.textColor}`} />
            <span className={`font-medium ${habilitationInfo.textColor}`}>{habilitationInfo.text}</span>
        </div>
         <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>Membro desde: {user.createdAt ? format(new Date(user.createdAt as string), 'dd/MM/yyyy') : 'N/A'}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Button asChild className="w-full">
            <Link href={`/admin/users/${user.id}/edit`}>
                <Eye className="mr-2 h-4 w-4" /> Gerenciar Usuário
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
