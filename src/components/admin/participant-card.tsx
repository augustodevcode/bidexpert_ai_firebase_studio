/**
 * ParticipantCard Component
 * 
 * Componente reutilizável para exibir informações de participantes em leilões
 * (Leiloeiro, Comitente, Processo Judicial) em formato de card visual rico.
 * 
 * Features:
 * - Exibição de foto/logo com fallback para avatar
 * - Dados básicos do participante
 * - Botão para remover a seleção
 * - Design responsivo e consistente
 */
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { X, Gavel, Building2, FileText, Mail, Phone, MapPin, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ParticipantType = 'auctioneer' | 'seller' | 'judicialProcess';

export interface ParticipantCardData {
  id: string;
  name: string;
  logoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  website?: string | null;
  registrationNumber?: string | null;
  description?: string | null;
  // Campos específicos para processo judicial
  processNumber?: string;
  courtName?: string;
  districtName?: string;
  branchName?: string;
  isElectronic?: boolean;
}

interface ParticipantCardProps {
  type: ParticipantType;
  data: ParticipantCardData | null;
  onRemove?: () => void;
  className?: string;
  isLoading?: boolean;
}

const typeConfig: Record<ParticipantType, { icon: React.ElementType; label: string; badgeClass: string }> = {
  auctioneer: {
    icon: Gavel,
    label: 'Leiloeiro',
    badgeClass: 'bg-primary/10 text-primary border-primary/20',
  },
  seller: {
    icon: Building2,
    label: 'Comitente',
    badgeClass: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  },
  judicialProcess: {
    icon: FileText,
    label: 'Processo Judicial',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function ParticipantCard({
  type,
  data,
  onRemove,
  className,
}: ParticipantCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  if (!data) {
    return null;
  }

  const isJudicialProcess = type === 'judicialProcess';
  const displayName = isJudicialProcess ? data.processNumber || data.name : data.name;
  const locationParts = [data.city, data.state].filter(Boolean);
  const location = locationParts.length > 0 ? locationParts.join(', ') : null;

  return (
    <Card
      className={cn(
        'relative overflow-hidden border transition-all duration-200 hover:shadow-md',
        'bg-card/50 backdrop-blur-sm',
        className
      )}
      data-testid={`participant-card-${type}`}
    >
      <CardContent className="p-4">
        {/* Header com badge e botão remover */}
        <div className="flex items-start justify-between mb-3">
          <Badge
            variant="outline"
            className={cn('text-xs font-medium', config.badgeClass)}
          >
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={onRemove}
              aria-label={`Remover ${config.label}`}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Conteúdo principal */}
        <div className="flex gap-3">
          {/* Avatar/Logo */}
          {!isJudicialProcess && (
            <Avatar className="h-14 w-14 border-2 border-border shrink-0">
              {data.logoUrl ? (
                <AvatarImage src={data.logoUrl} alt={data.name} />
              ) : null}
              <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">
                {getInitials(data.name)}
              </AvatarFallback>
            </Avatar>
          )}

          {/* Ícone para processo judicial */}
          {isJudicialProcess && (
            <div className="h-14 w-14 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 border-2 border-amber-500/20">
              <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          )}

          {/* Informações */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <h4 className="font-semibold text-sm text-foreground truncate" title={displayName}>
              {displayName}
            </h4>

            {/* Dados específicos do processo judicial */}
            {isJudicialProcess && (
              <div className="space-y-1 text-xs text-muted-foreground">
                {data.courtName && (
                  <p className="flex items-center gap-1.5 truncate" title={data.courtName}>
                    <Building2 className="h-3 w-3 shrink-0" />
                    <span className="truncate">{data.courtName}</span>
                  </p>
                )}
                {data.branchName && (
                  <p className="flex items-center gap-1.5 truncate" title={data.branchName}>
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{data.branchName}</span>
                  </p>
                )}
                {data.isElectronic !== undefined && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {data.isElectronic ? 'Eletrônico' : 'Físico'}
                  </Badge>
                )}
              </div>
            )}

            {/* Dados do leiloeiro/comitente */}
            {!isJudicialProcess && (
              <div className="space-y-1 text-xs text-muted-foreground">
                {data.registrationNumber && type === 'auctioneer' && (
                  <p className="flex items-center gap-1.5">
                    <User className="h-3 w-3 shrink-0" />
                    <span className="truncate">Reg: {data.registrationNumber}</span>
                  </p>
                )}
                {data.email && (
                  <p className="flex items-center gap-1.5 truncate" title={data.email}>
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{data.email}</span>
                  </p>
                )}
                {data.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span>{data.phone}</span>
                  </p>
                )}
                {location && (
                  <p className="flex items-center gap-1.5 truncate" title={location}>
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{location}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ParticipantCard;
