/**
 * @fileoverview Conteúdo client-side da página de perfil do usuário autenticado.
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Loader2,
  UserCog,
  Mail,
  Phone,
  Home,
  Building,
  Calendar,
  ShieldCheck,
  BadgeInfo,
  FileText,
  Edit,
  AlertCircle,
  Award,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const InfoItem = ({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value?: string | null; href?: string }) => {
  if (!value) return null;
  return (
    <div className="flex items-start text-sm">
      <Icon className="mr-3 mt-1 h-4 w-4 flex-shrink-0 text-primary" />
      <div>
        <span className="font-semibold text-foreground">{label}:</span>{' '}
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:underline">
            {value}
          </a>
        ) : (
          <span className="text-muted-foreground">{value}</span>
        )}
      </div>
    </div>
  );
};

const badgeMap: Record<string, { icon: React.ElementType; label: string; description: string }> = {
  PRIMEIRO_ARREMATE: { icon: Award, label: 'Primeiro Arremate', description: 'Parabéns por seu primeiro lote arrematado!' },
};

export default function ProfilePageClient() {
  const { userProfileWithPermissions, loading } = useAuth();
  const [formattedDateOfBirth, setFormattedDateOfBirth] = useState<string | null>(null);

  useEffect(() => {
    if (userProfileWithPermissions?.dateOfBirth && isValid(new Date(userProfileWithPermissions.dateOfBirth))) {
      setFormattedDateOfBirth(format(new Date(userProfileWithPermissions.dateOfBirth), 'dd/MM/yyyy', { locale: ptBR }));
    } else {
      setFormattedDateOfBirth(null);
    }
  }, [userProfileWithPermissions?.dateOfBirth]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Carregando seu perfil...</p>
      </div>
    );
  }

  if (!userProfileWithPermissions) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold text-destructive">Usuário não encontrado</h2>
        <p className="text-muted-foreground">Por favor, faça login para ver seu perfil.</p>
        <Button asChild className="mt-4">
          <Link href="/auth/login?redirect=/profile">Ir para Login</Link>
        </Button>
      </div>
    );
  }

  const {
    fullName,
    email,
    avatarUrl,
    dataAiHint,
    roleName,
    habilitationStatus,
    cellPhone,
    homePhone,
    cpf,
    street,
    number,
    complement,
    neighborhood,
    city,
    state,
    zipCode,
    accountType,
    razaoSocial,
    cnpj,
    badges,
  } = userProfileWithPermissions;

  const userInitial = fullName ? fullName.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : 'U');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <Avatar className="h-24 w-24 border-4 border-primary/30">
              <AvatarImage src={avatarUrl || 'https://placehold.co/128x128.png'} alt={fullName || 'Avatar'} data-ai-hint={dataAiHint || 'profile avatar'} />
              <AvatarFallback className="text-4xl">{userInitial}</AvatarFallback>
            </Avatar>
            <div className="flex-grow text-center sm:text-left">
              <CardTitle className="font-headline text-3xl font-bold">{fullName || email}</CardTitle>
              <CardDescription className="mt-1 text-lg">{email}</CardDescription>
            </div>
            <Button asChild>
              <Link href="/dashboard/profile/edit">
                <Edit className="mr-2 h-4 w-4" /> Editar Perfil
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <Card className="bg-secondary/30">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center text-lg font-semibold">
                <ShieldCheck className="mr-2 h-5 w-5 text-muted-foreground" />Status da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div className="flex items-center"><strong className="w-24">Perfil:</strong> <Badge variant="outline">{roleName || 'Não definido'}</Badge></div>
              <div className="flex items-center"><strong className="w-24">Habilitação:</strong> <Badge variant="outline">{habilitationStatus || 'Pendente'}</Badge></div>
            </CardContent>
          </Card>

          {badges && badges.length > 0 && (
            <section>
              <h3 className="mb-3 flex items-center border-b pb-1 text-lg font-semibold text-primary"><Award className="mr-2 h-5 w-5" />Conquistas e Medalhas</h3>
              <div className="flex flex-wrap gap-4">
                {badges.map((badgeKey) => {
                  const badgeInfo = badgeMap[badgeKey as keyof typeof badgeMap];
                  if (!badgeInfo) return null;
                  const Icon = badgeInfo.icon;
                  return (
                    <TooltipProvider key={badgeKey}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex w-24 flex-col items-center gap-1 rounded-md border bg-background p-3">
                            <Icon className="h-8 w-8 text-amber-500" />
                            <span className="text-center text-xs font-medium">{badgeInfo.label}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{badgeInfo.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-3 flex items-center border-b pb-1 text-lg font-semibold text-primary"><UserCog className="mr-2 h-5 w-5" />Informações Pessoais</h3>
            <div className="space-y-3">
              <InfoItem icon={BadgeInfo} label="Tipo de Conta" value={accountType === 'LEGAL' ? 'Pessoa Jurídica' : 'Pessoa Física'} />
              {accountType === 'LEGAL' ? (
                <>
                  <InfoItem icon={Building} label="Razão Social" value={razaoSocial} />
                  <InfoItem icon={FileText} label="CNPJ" value={cnpj} />
                </>
              ) : (
                <>
                  <InfoItem icon={FileText} label="CPF" value={cpf} />
                  <InfoItem icon={Calendar} label="Data de Nascimento" value={formattedDateOfBirth} />
                </>
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-3 flex items-center border-b pb-1 text-lg font-semibold text-primary"><Mail className="mr-2 h-5 w-5" />Contato</h3>
            <div className="space-y-3">
              <InfoItem icon={Phone} label="Celular" value={cellPhone} href={`tel:${cellPhone}`} />
              <InfoItem icon={Phone} label="Telefone Fixo" value={homePhone} href={`tel:${homePhone}`} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 flex items-center border-b pb-1 text-lg font-semibold text-primary"><Home className="mr-2 h-5 w-5" />Endereço</h3>
            <div className="space-y-3">
              <InfoItem icon={Home} label="Logradouro" value={`${street || ''}${number ? `, ${number}` : ''}`} />
              <InfoItem icon={Home} label="Bairro" value={neighborhood} />
              <InfoItem icon={Home} label="Cidade/UF" value={`${city || ''}${state ? ` - ${state}` : ''}`.trim() || null} />
              <InfoItem icon={MapPin} label="CEP" value={zipCode} />
              <InfoItem icon={Home} label="Complemento" value={complement} />
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}