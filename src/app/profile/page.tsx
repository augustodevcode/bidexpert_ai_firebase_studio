
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mail, MapPin, Edit3, User, Phone, Briefcase, Landmark, Users, ShieldCheck, CreditCard, FileText, CalendarDays, Loader2, UserCog } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { UserProfileData } from '@/types'; // Import UserProfileData type

// Removed initialProfileData as it's now fetched

export default function ProfilePage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!authUser) {
      setIsLoading(false);
      setError("Usuário não autenticado. Por favor, faça login.");
      return;
    }

    const fetchUserProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userDocRef = doc(db, 'users', authUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfileData; // Cast to UserProfileData
          setProfileData({
            ...data, // Spread all data from Firestore
            uid: authUser.uid, // Ensure uid from authUser is used
            email: authUser.email || data.email, // Prefer authUser email
            fullName: data.fullName || authUser.displayName || 'Nome não informado',
            // Use a real avatar if available, or default placeholder
            avatarUrl: authUser.photoURL || data.avatarUrl || 'https://placehold.co/128x128.png',
            dataAiHint: data.dataAiHint || 'profile photo placeholder',
            // Ensure dates are Date objects if they are Firestore Timestamps
            dateOfBirth: data.dateOfBirth?.toDate ? data.dateOfBirth.toDate() : (data.dateOfBirth || null),
            rgIssueDate: data.rgIssueDate?.toDate ? data.rgIssueDate.toDate() : (data.rgIssueDate || null),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || null),
          });
        } else {
          setError("Perfil não encontrado no banco de dados.");
          setProfileData(null);
        }
      } catch (e: any) {
        console.error("Error fetching user profile:", e);
        setError("Erro ao buscar dados do perfil.");
        setProfileData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [authUser, authLoading]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-destructive">{error}</h2>
        {!authUser && (
          <Button asChild className="mt-4">
            <Link href="/auth/login">Ir para Login</Link>
          </Button>
        )}
      </div>
    );
  }
  
  if (!profileData) {
     return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-muted-foreground">Não foi possível carregar os dados do perfil.</h2>
      </div>
    );
  }

  const userInitial = profileData.fullName ? profileData.fullName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : "U";
  const formattedDateOfBirth = profileData.dateOfBirth ? format(new Date(profileData.dateOfBirth), 'dd/MM/yyyy', { locale: ptBR }) : 'Não informado';
  const formattedRgIssueDate = profileData.rgIssueDate ? format(new Date(profileData.rgIssueDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Não informado';
  const formattedMemberSince = profileData.createdAt ? format(new Date(profileData.createdAt), 'dd/MM/yyyy', { locale: ptBR }) : 'Não informado';


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="relative pb-0">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary to-accent rounded-t-lg" />
          <div className="relative flex flex-col items-center pt-8 sm:flex-row sm:items-end sm:space-x-6">
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={profileData.avatarUrl} alt={profileData.fullName} data-ai-hint={profileData.dataAiHint} />
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left mt-4 sm:mt-0 pb-2">
              <CardTitle className="text-3xl font-bold font-headline">{profileData.fullName}</CardTitle>
              <CardDescription className="text-muted-foreground flex items-center justify-center sm:justify-start">
                <Mail className="h-4 w-4 mr-2" /> {profileData.email}
              </CardDescription>
               <CardDescription className="text-muted-foreground text-xs mt-1">
                Status da Conta: <span className="font-semibold text-green-600">{profileData.status || 'Não definido'}</span>
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="absolute top-4 right-4 sm:static sm:ml-auto" asChild>
              <Link href="/profile/edit">
                <UserCog className="h-4 w-4 mr-2" /> Editar Perfil
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          
          <section>
            <h3 className="text-xl font-semibold mb-3 text-primary flex items-center">
              <User className="h-5 w-5 mr-2" /> Informações Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div><span className="font-medium text-foreground">CPF:</span> <span className="text-muted-foreground">{profileData.cpf || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Data de Nascimento:</span> <span className="text-muted-foreground">{formattedDateOfBirth}</span></div>
              <div><span className="font-medium text-foreground">Celular:</span> <span className="text-muted-foreground">{profileData.cellPhone || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Telefone Residencial:</span> <span className="text-muted-foreground">{profileData.homePhone || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Gênero:</span> <span className="text-muted-foreground">{profileData.gender || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Profissão:</span> <span className="text-muted-foreground">{profileData.profession || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Nacionalidade:</span> <span className="text-muted-foreground">{profileData.nationality || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Estado Civil:</span> <span className="text-muted-foreground">{profileData.maritalStatus || 'Não informado'}</span></div>
               { (profileData.maritalStatus === "Casado(a)" || profileData.maritalStatus === "União Estável") && (
                <>
                  <div><span className="font-medium text-foreground">Regime de Bens:</span> <span className="text-muted-foreground">{profileData.propertyRegime || 'Não informado'}</span></div>
                  <div><span className="font-medium text-foreground">Nome do Cônjuge:</span> <span className="text-muted-foreground">{profileData.spouseName || 'Não informado'}</span></div>
                  <div><span className="font-medium text-foreground">CPF do Cônjuge:</span> <span className="text-muted-foreground">{profileData.spouseCpf || 'Não informado'}</span></div>
                </>
              )}
              <div><span className="font-medium text-foreground">Membro Desde:</span> <span className="text-muted-foreground">{formattedMemberSince}</span></div>
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="text-xl font-semibold mb-3 text-primary flex items-center">
              <FileText className="h-5 w-5 mr-2" /> Documentos (RG)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div><span className="font-medium text-foreground">RG:</span> <span className="text-muted-foreground">{profileData.rgNumber || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Órgão Emissor:</span> <span className="text-muted-foreground">{profileData.rgIssuer || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">UF Emissor:</span> <span className="text-muted-foreground">{profileData.rgState || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Data de Emissão do RG:</span> <span className="text-muted-foreground">{formattedRgIssueDate}</span></div>
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="text-xl font-semibold mb-3 text-primary flex items-center">
              <MapPin className="h-5 w-5 mr-2" /> Endereço
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div><span className="font-medium text-foreground">CEP:</span> <span className="text-muted-foreground">{profileData.zipCode || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Logradouro:</span> <span className="text-muted-foreground">{profileData.street ? `${profileData.street}, ${profileData.number || ''}` : 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Complemento:</span> <span className="text-muted-foreground">{profileData.complement || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Bairro:</span> <span className="text-muted-foreground">{profileData.neighborhood || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Cidade:</span> <span className="text-muted-foreground">{profileData.city || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Estado:</span> <span className="text-muted-foreground">{profileData.state || 'Não informado'}</span></div>
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="text-xl font-semibold mb-4 text-primary flex items-center">
              <Briefcase className="h-5 w-5 mr-2" /> Atividade de Leilões (Placeholder)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <Card className="p-4 bg-secondary/50">
                <p className="text-3xl font-bold text-primary">{profileData.activeBids || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Lances Ativos</p>
              </Card>
              <Card className="p-4 bg-secondary/50">
                <p className="text-3xl font-bold text-primary">{profileData.auctionsWon || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Leilões Ganhos</p>
              </Card>
              <Card className="p-4 bg-secondary/50">
                <p className="text-3xl font-bold text-primary">{profileData.itemsSold || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Itens Vendidos (Comitente)</p>
              </Card>
            </div>
          </section>
          
          <Separator />

          <section>
             <h3 className="text-xl font-semibold mb-3 text-primary flex items-center">
              <Landmark className="h-5 w-5 mr-2" /> Gerenciamento da Conta
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" asChild className="justify-start text-left h-auto py-3">
                    <Link href="/dashboard/documents">
                        <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                        <div>
                            <span className="font-medium">Meus Documentos e Habilitação</span>
                            <p className="text-xs text-muted-foreground">Verifique o status e envie documentos.</p>
                        </div>
                    </Link>
                </Button>
                <Button variant="outline" asChild className="justify-start text-left h-auto py-3" disabled>
                    {/* <Link href="/dashboard/financial"> */}
                        <CreditCard className="h-5 w-5 mr-3 text-muted-foreground" />
                         <div>
                            <span className="font-medium">Informações Financeiras (Em breve)</span>
                            <p className="text-xs text-muted-foreground">Gerencie seus pagamentos e recebimentos.</p>
                        </div>
                    {/* </Link> */}
                </Button>
                 <Button variant="outline" asChild className="justify-start text-left h-auto py-3" disabled>
                    {/* <Link href="/dashboard/preferences"> */}
                        <Users className="h-5 w-5 mr-3 text-muted-foreground" />
                         <div>
                            <span className="font-medium">Preferências e Notificações (Em breve)</span>
                            <p className="text-xs text-muted-foreground">Ajuste como você recebe informações.</p>
                        </div>
                    {/* </Link> */}
                </Button>
            </div>
          </section>

        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Preferências de Marketing: {profileData.optInMarketing ? "Você optou por receber comunicações de marketing." : "Você optou por não receber comunicações de marketing."}
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

