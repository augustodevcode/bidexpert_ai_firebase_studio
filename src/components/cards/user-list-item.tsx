// src/components/cards/user-list-item.tsx
'use client';

import * as React from 'react';
import type { UserProfileWithPermissions } from '@/types';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, UserCog } from 'lucide-react';
import { getUserHabilitationStatusInfo } from '@/lib/ui-helpers';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import EntityEditMenu from '../entity-edit-menu';

interface UserListItemProps {
  user: UserProfileWithPermissions;
  onUpdate?: () => void;
}

export default function UserListItem({ user, onUpdate }: UserListItemProps) {
  const userInitial = user.fullName ? user.fullName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');
  const habilitationInfo = getUserHabilitationStatusInfo(user.habilitationStatus);
  const HabilitationIcon = habilitationInfo.icon;
  
  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg group overflow-hidden">
      <div className="flex items-center p-4 gap-4">
        <Link href={`/admin/users/${user.id}/edit`}>
          <Avatar className="h-14 w-14 border">
            <AvatarImage src={user.avatarUrl || ''} alt={user.fullName || 'Avatar'} data-ai-hint="avatar usuario pequeno"/>
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-grow">
          <Link href={`/admin/users/${user.id}/edit`} className="group/link">
            <h3 className="text-base font-semibold text-foreground group-hover/link:text-primary transition-colors">{user.fullName}</h3>
          </Link>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="outline" className={`border-l-2 ${habilitationInfo.textColor.replace('text-', 'border-')}`}>
              <HabilitationIcon className={`h-3.5 w-3.5 mr-1.5 ${habilitationInfo.textColor}`} />
              {habilitationInfo.text}
            </Badge>
            {(user.roleNames || []).map(role => (
              <Badge key={role} variant="secondary" className="font-normal">
                <UserCog className="h-3 w-3 mr-1"/>{role}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/users/${user.id}/edit`}><Eye className="mr-2 h-4 w-4" />Ver Perfil</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
