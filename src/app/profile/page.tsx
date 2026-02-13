// src/app/profile/page.tsx
/**
 * @fileoverview Página "Meu Perfil" do Painel do Usuário.
 * Este componente de cliente exibe as informações de perfil do usuário logado.
 * Ele busca os dados do contexto de autenticação e os apresenta em seções
 * organizadas, como informações da conta, pessoais e de endereço. Inclui
 * também um link para a página de edição de perfil.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, UserCog, Mail, Phone, Home, Building, Briefcase, Calendar, ShieldCheck, BadgeInfo, FileText, Edit, AlertCircle, Award, MapPin } from 'lucide-react';
import Link from 'next/link';
import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const InfoItem = ({ icon: Icon, label, value, href }: { icon: React.ElementType, label: string, value?: string | null, href?: string }) => {
  if (!value) return null;
  return (
    <div className="flex items-start text-sm">
      <Icon className="h-4 w-4 mr-3 mt-1 text-primary flex-shrink-0" />
      <div>
        <span className="font-semibold text-foreground">{label}:</span>{' '}
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:underline">{value}</a>
        ) : (
          <span className="text-muted-foreground">{value}</span>
        )}
      </div>
    </div>
  );
};

const badgeMap: Record<string, { icon: React.ElementType, label: string, description: string }> = {
    'PRIMEIRO_ARREMATE': { icon: Award, label: "Primeiro Arremate", description: "Parabéns por seu primeiro lote arrematado!" },
    // Adicionar outros badges aqui conforme o sistema evolui
};

export default function ProfilePage() {
  const { userProfileWithPermissions, loading } = useAuth();
  const router = useRouter();
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
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Carregando seu perfil...</p>
      </div>
    );
  }

  if (!userProfileWithPermissions) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive">Usuário não encontrado</h2>
        <p className="text-muted-foreground">Por favor, faça login para ver seu perfil.</p>
        <Button asChild className="mt-4"><Link href="/auth/login?redirect=/profile">Ir para Login</Link></Button>
      </div>
    );
  }
  
  const { 
    fullName, email, avatarUrl, dataAiHint, roleName, habilitationStatus,
    cellPhone, homePhone, cpf, dateOfBirth, street, number, complement,
    neighborhood, city, state, zipCode, accountType, razaoSocial, cnpj,
    badges
  } = userProfileWithPermissions;
  
  const userInitial = fullName ? fullName.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : "U");
  const fullAddress = [street, number, complement, neighborhood, city, state, zipCode].filter(Boolean).join(', ');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-primary/30">
              <AvatarImage src={avatarUrl || `https://placehold.co/128x128.png`} alt={fullName || 'Avatar'} data-ai-hint={dataAiHint || "profile avatar"} />
              <AvatarFallback className="text-4xl">{userInitial}</AvatarFallback>
            </Avatar>
            <div className="flex-grow text-center sm:text-left">
              <CardTitle className="text-3xl font-bold font-headline">{fullName || email}</CardTitle>
              <CardDescription className="text-lg mt-1">{email}</CardDescription>
            </div>
             <Button asChild>
               <Link href="/dashboard/profile/edit"><Edit className="mr-2 h-4 w-4" /> Editar Perfil</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          
          <Card className="bg-secondary/30">
             <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-muted-foreground" />Status da Conta</CardTitle>
             </CardHeader>
             <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center"><strong className="w-24">Perfil:</strong> <Badge variant="outline">{roleName || 'Não definido'}</Badge></div>
                <div className="flex items-center"><strong className="w-24">Habilitação:</strong> <Badge variant="outline">{habilitationStatus || 'Pendente'}</Badge></div>
             </CardContent>
          </Card>
          
          {badges && badges.length > 0 && (
            <section>
                 <h3 className="text-lg font-semibold text-primary border-b pb-1 mb-3 flex items-center"><Award className="mr-2 h-5 w-5"/>Conquistas e Medalhas</h3>
                 <div className="flex flex-wrap gap-4">
                    {badges.map(badgeKey => {
                        const badgeInfo = badgeMap[badgeKey as keyof typeof badgeMap];
                        if (!badgeInfo) return null;
                        const Icon = badgeInfo.icon;
                        return (
                             <TooltipProvider key={badgeKey}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex flex-col items-center gap-1 p-3 rounded-md border bg-background w-24">
                                            <Icon className="h-8 w-8 text-amber-500" />
                                            <span className="text-xs font-medium text-center">{badgeInfo.label}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{badgeInfo.description}</p>
                                    </TooltipContent>
                                </Tooltip>
                             </TooltipProvider>
                        )
                    })}
                 </div>
            </section>
          )}

          <section>
            <h3 className="text-lg font-semibold text-primary border-b pb-1 mb-3 flex items-center"><UserCog className="mr-2 h-5 w-5"/>Informações Pessoais</h3>
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
            <h3 className="text-lg font-semibold text-primary border-b pb-1 mb-3 flex items-center"><Mail className="mr-2 h-5 w-5"/>Contato</h3>
            <div className="space-y-3">
              <InfoItem icon={Phone} label="Celular" value={cellPhone} href={`tel:${cellPhone}`} />
              <InfoItem icon={Phone} label="Telefone Fixo" value={homePhone} href={`tel:${homePhone}`} />
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-primary border-b pb-1 mb-3 flex items-center"><Home className="mr-2 h-5 w-5"/>Endereço</h3>
            <div className="space-y-3">
                <InfoItem icon={Home} label="Logradouro" value={`${street || ''}${number ? ', ' + number : ''}`} />
                <InfoItem icon={Home} label="Bairro" value={neighborhood} />
                <InfoItem icon={Home} label="Cidade/UF" value={`${city || ''}${state ? ' - ' + state : ''}`.trim() || null} />
                <InfoItem icon={MapPin} label="CEP" value={zipCode} />
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
