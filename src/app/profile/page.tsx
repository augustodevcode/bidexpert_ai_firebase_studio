
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, UserCog, Mail, Phone, Home, Building, Briefcase, Calendar, ShieldCheck, BadgeInfo, FileText, Edit, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

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

export default function ProfilePage() {
  const { userProfileWithPermissions, loading } = useAuth();
  const router = useRouter();

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
        <Button asChild className="mt-4">
          <Link href="/auth/login?redirect=/profile">Ir para Login</Link>
        </Button>
      </div>
    );
  }
  
  const { 
    fullName, email, avatarUrl, dataAiHint, roleName, habilitationStatus,
    cellPhone, homePhone, cpf, dateOfBirth, street, number, complement,
    neighborhood, city, state, zipCode, accountType, razaoSocial, cnpj
  } = userProfileWithPermissions;
  
  const userInitial = fullName ? fullName.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : "U");

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
                <Link href="/profile/edit"><Edit className="mr-2 h-4 w-4" /> Editar Perfil</Link>
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
                  <InfoItem icon={Calendar} label="Data de Nascimento" value={dateOfBirth ? format(new Date(dateOfBirth as string), 'dd/MM/yyyy', { locale: ptBR }) : null} />
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
              <InfoItem icon={Home} label="Endereço" value={`${street || ''}${number ? ', ' + number : ''}${complement ? ' - ' + complement : ''}`.trim() || null} />
              <InfoItem icon={Home} label="Bairro" value={neighborhood} />
              <InfoItem icon={Home} label="Cidade/UF" value={`${city || ''}${state ? ' - ' + state : ''}`.trim() || null} />
              <InfoItem icon={Home} label="CEP" value={zipCode} />
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
