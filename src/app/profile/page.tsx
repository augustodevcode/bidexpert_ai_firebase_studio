
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mail, MapPin, Edit3, User, Phone, Briefcase, Landmark, Users, ShieldCheck, CreditCard, FileText, CalendarDays, Loader2, UserCog } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type FormEvent, useCallback } from 'react'; // useCallback adicionado
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { updateUserProfile, type EditableUserProfileData } from './actions';
import type { UserProfileData } from '@/types';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; 
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon } from 'lucide-react'; // CalendarIcon importado

const profileFormSchema = z.object({
  fullName: z.string().min(3, { message: 'Nome completo deve ter pelo menos 3 caracteres.' }),
  cpf: z.string().optional(),
  rgNumber: z.string().optional(),
  rgIssuer: z.string().optional(),
  rgIssueDate: z.date().optional().nullable(),
  rgState: z.string().optional(),
  dateOfBirth: z.date().optional().nullable(),
  cellPhone: z.string().optional(),
  homePhone: z.string().optional(),
  gender: z.string().optional(),
  profession: z.string().optional(),
  nationality: z.string().optional(),
  maritalStatus: z.string().optional(),
  propertyRegime: z.string().optional(),
  spouseName: z.string().optional(),
  spouseCpf: z.string().optional(),
  zipCode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  optInMarketing: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const genderOptions = ["Masculino", "Feminino", "Outro", "Prefiro não informar"];
const maritalStatusOptions = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"];
const propertyRegimeOptions = ["Comunhão Parcial de Bens", "Comunhão Universal de Bens", "Separação Total de Bens", "Participação Final nos Aquestos"];


export default function ProfilePage() {
  const { user: authUser, userProfileWithPermissions, loading: authContextLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [profileToDisplay, setProfileToDisplay] = useState<UserProfileData | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [errorPage, setErrorPage] = useState<string | null>(null);
  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  
  // Definindo o form aqui, pois será usado no fetchProfileData e no onSubmit
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: '', cpf: '', rgNumber: '', rgIssuer: '', rgIssueDate: null, rgState: '',
      dateOfBirth: null, cellPhone: '', homePhone: '', gender: '', profession: '',
      nationality: '', maritalStatus: '', propertyRegime: '', spouseName: '', spouseCpf: '',
      zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '',
      state: '', optInMarketing: false,
    },
  });

  const fetchProfileData = useCallback(async (uid: string) => {
    setIsLoadingPage(true);
    setErrorPage(null);
    console.log('[ProfilePage] Attempting to fetch profile for UID:', uid);
    try {
      const userDocRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfileData;
        const processedData = {
          ...data,
          uid: authUser?.uid || data.uid,
          email: authUser?.email || data.email,
          fullName: data.fullName || authUser?.displayName || 'Nome não informado',
          avatarUrl: authUser?.photoURL || data.avatarUrl || 'https://placehold.co/128x128.png',
          dataAiHint: data.dataAiHint || 'profile photo placeholder',
          dateOfBirth: data.dateOfBirth?.toDate ? data.dateOfBirth.toDate() : (data.dateOfBirth || null),
          rgIssueDate: data.rgIssueDate?.toDate ? data.rgIssueDate.toDate() : (data.rgIssueDate || null),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || null),
        };
        setProfileToDisplay(processedData as UserProfileData);
        // Reset form with fetched data
        form.reset({
            fullName: processedData.fullName || '',
            cpf: processedData.cpf || '',
            rgNumber: processedData.rgNumber || '',
            rgIssuer: processedData.rgIssuer || '',
            rgIssueDate: processedData.rgIssueDate instanceof Date ? processedData.rgIssueDate : null,
            rgState: processedData.rgState || '',
            dateOfBirth: processedData.dateOfBirth instanceof Date ? processedData.dateOfBirth : null,
            cellPhone: processedData.cellPhone || '',
            homePhone: processedData.homePhone || '',
            gender: processedData.gender || '',
            profession: processedData.profession || '',
            nationality: processedData.nationality || '',
            maritalStatus: processedData.maritalStatus || '',
            propertyRegime: processedData.propertyRegime || '',
            spouseName: processedData.spouseName || '',
            spouseCpf: processedData.spouseCpf || '',
            zipCode: processedData.zipCode || '',
            street: processedData.street || '',
            number: processedData.number || '',
            complement: processedData.complement || '',
            neighborhood: processedData.neighborhood || '',
            city: processedData.city || '',
            state: processedData.state || '',
            optInMarketing: processedData.optInMarketing || false,
        });
        console.log(`[ProfilePage] Firestore Profile found and form reset:`, processedData.email);
      } else {
        setErrorPage("Perfil não encontrado no banco de dados Firestore.");
        console.error(`[ProfilePage] Firestore Profile not found for UID: ${uid}`);
        setProfileToDisplay(null);
      }
    } catch (e: any) {
      setErrorPage("Erro ao buscar dados do perfil do Firestore.");
      console.error(`[ProfilePage] Error fetching Firestore profile:`, e);
      setProfileToDisplay(null);
    } finally {
      setIsLoadingPage(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, form.reset]); // form.reset é estável

  useEffect(() => {
    const system = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM?.toUpperCase() || 'FIRESTORE';
    setActiveSystem(system);
    console.log(`[ProfilePage useEffect] System: ${system}, AuthContextLoading: ${authContextLoading}, AuthUser: ${authUser?.email}, UserProfileCtx: ${userProfileWithPermissions?.email}`);

    if (authContextLoading) {
      console.log("[ProfilePage useEffect] AuthContext still loading, waiting...");
      setIsLoadingPage(true);
      return;
    }

    if (system === 'FIRESTORE') {
      if (!authUser) {
        console.log("[ProfilePage useEffect - FIRESTORE] Firebase user not authenticated. Redirecting to login.");
        setErrorPage("Usuário não autenticado. Por favor, faça login.");
        router.push('/auth/login?redirect=/profile');
        setIsLoadingPage(false);
        return;
      }
      fetchProfileData(authUser.uid);
    } else { // MYSQL or POSTGRES
      console.log("[ProfilePage useEffect - SQL] Checking userProfileWithPermissions from AuthContext.");
      if (userProfileWithPermissions) {
        console.log("[ProfilePage useEffect - SQL] Using userProfileWithPermissions from context:", userProfileWithPermissions.email);
        const processedProfile = {
          ...userProfileWithPermissions,
          dateOfBirth: userProfileWithPermissions.dateOfBirth ? new Date(userProfileWithPermissions.dateOfBirth) : null,
          rgIssueDate: userProfileWithPermissions.rgIssueDate ? new Date(userProfileWithPermissions.rgIssueDate) : null,
          createdAt: userProfileWithPermissions.createdAt ? new Date(userProfileWithPermissions.createdAt) : undefined,
          updatedAt: userProfileWithPermissions.updatedAt ? new Date(userProfileWithPermissions.updatedAt) : undefined,
        };
        setProfileToDisplay(processedProfile as UserProfileData);
        form.reset(processedProfile as ProfileFormValues); // Reset form with SQL profile data
        setIsLoadingPage(false);
      } else {
        console.log("[ProfilePage useEffect - SQL] userProfileWithPermissions is null. Redirecting to login.");
        setErrorPage("Usuário não autenticado (SQL). Por favor, faça login.");
        router.push('/auth/login?redirect=/profile');
        setIsLoadingPage(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, userProfileWithPermissions, authContextLoading, fetchProfileData]); // fetchProfileData adicionado
  

  if (isLoadingPage) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  if (errorPage) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-destructive">{errorPage}</h2>
        <Button asChild className="mt-4">
          <Link href="/auth/login?redirect=/profile">Ir para Login</Link>
        </Button>
         <Button 
            variant="outline" 
            onClick={() => {
                if (authUser?.uid) fetchProfileData(authUser.uid);
            }} 
            className="mt-4 ml-2"
            disabled={isLoadingPage || authContextLoading}
        >
          Tentar Novamente
        </Button>
      </div>
    );
  }
  
  if (!profileToDisplay) {
     return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-muted-foreground">Não foi possível carregar os dados do perfil.</h2>
        <p className="text-sm text-muted-foreground">Tente novamente mais tarde ou contate o suporte.</p>
      </div>
    );
  }

  const userInitial = profileToDisplay.fullName ? profileToDisplay.fullName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : "U";
  const formattedDateOfBirth = profileToDisplay.dateOfBirth ? format(new Date(profileToDisplay.dateOfBirth), 'dd/MM/yyyy', { locale: ptBR }) : 'Não informado';
  const formattedRgIssueDate = profileToDisplay.rgIssueDate ? format(new Date(profileToDisplay.rgIssueDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Não informado';
  const formattedMemberSince = profileToDisplay.createdAt ? format(new Date(profileToDisplay.createdAt), 'dd/MM/yyyy', { locale: ptBR }) : 'Não informado';


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="relative pb-0">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary to-accent rounded-t-lg" />
          <div className="relative flex flex-col items-center pt-8 sm:flex-row sm:items-end sm:space-x-6">
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={profileToDisplay.avatarUrl} alt={profileToDisplay.fullName} data-ai-hint={profileToDisplay.dataAiHint} />
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left mt-4 sm:mt-0 pb-2">
              <CardTitle className="text-3xl font-bold font-headline">{profileToDisplay.fullName}</CardTitle>
              <CardDescription className="text-muted-foreground flex items-center justify-center sm:justify-start">
                <Mail className="h-4 w-4 mr-2" /> {profileToDisplay.email}
              </CardDescription>
               <CardDescription className="text-muted-foreground text-xs mt-1">
                Status da Conta: <span className="font-semibold text-green-600">{profileToDisplay.status || 'Não definido'}</span>
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
              <div><span className="font-medium text-foreground">CPF:</span> <span className="text-muted-foreground">{profileToDisplay.cpf || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Data de Nascimento:</span> <span className="text-muted-foreground">{formattedDateOfBirth}</span></div>
              <div><span className="font-medium text-foreground">Celular:</span> <span className="text-muted-foreground">{profileToDisplay.cellPhone || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Telefone Residencial:</span> <span className="text-muted-foreground">{profileToDisplay.homePhone || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Gênero:</span> <span className="text-muted-foreground">{profileToDisplay.gender || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Profissão:</span> <span className="text-muted-foreground">{profileToDisplay.profession || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Nacionalidade:</span> <span className="text-muted-foreground">{profileToDisplay.nationality || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Estado Civil:</span> <span className="text-muted-foreground">{profileToDisplay.maritalStatus || 'Não informado'}</span></div>
               { (profileToDisplay.maritalStatus === "Casado(a)" || profileToDisplay.maritalStatus === "União Estável") && (
                <>
                  <div><span className="font-medium text-foreground">Regime de Bens:</span> <span className="text-muted-foreground">{profileToDisplay.propertyRegime || 'Não informado'}</span></div>
                  <div><span className="font-medium text-foreground">Nome do Cônjuge:</span> <span className="text-muted-foreground">{profileToDisplay.spouseName || 'Não informado'}</span></div>
                  <div><span className="font-medium text-foreground">CPF do Cônjuge:</span> <span className="text-muted-foreground">{profileToDisplay.spouseCpf || 'Não informado'}</span></div>
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
              <div><span className="font-medium text-foreground">RG:</span> <span className="text-muted-foreground">{profileToDisplay.rgNumber || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Órgão Emissor:</span> <span className="text-muted-foreground">{profileToDisplay.rgIssuer || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">UF Emissor:</span> <span className="text-muted-foreground">{profileToDisplay.rgState || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Data de Emissão do RG:</span> <span className="text-muted-foreground">{formattedRgIssueDate}</span></div>
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="text-xl font-semibold mb-3 text-primary flex items-center">
              <MapPin className="h-5 w-5 mr-2" /> Endereço
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div><span className="font-medium text-foreground">CEP:</span> <span className="text-muted-foreground">{profileToDisplay.zipCode || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Logradouro:</span> <span className="text-muted-foreground">{profileToDisplay.street ? `${profileToDisplay.street}, ${profileToDisplay.number || ''}` : 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Complemento:</span> <span className="text-muted-foreground">{profileToDisplay.complement || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Bairro:</span> <span className="text-muted-foreground">{profileToDisplay.neighborhood || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Cidade:</span> <span className="text-muted-foreground">{profileToDisplay.city || 'Não informado'}</span></div>
              <div><span className="font-medium text-foreground">Estado:</span> <span className="text-muted-foreground">{profileToDisplay.state || 'Não informado'}</span></div>
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="text-xl font-semibold mb-4 text-primary flex items-center">
              <Briefcase className="h-5 w-5 mr-2" /> Atividade de Leilões (Placeholder)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <Card className="p-4 bg-secondary/50">
                <p className="text-3xl font-bold text-primary">{profileToDisplay.activeBids || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Lances Ativos</p>
              </Card>
              <Card className="p-4 bg-secondary/50">
                <p className="text-3xl font-bold text-primary">{profileToDisplay.auctionsWon || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Leilões Ganhos</p>
              </Card>
              <Card className="p-4 bg-secondary/50">
                <p className="text-3xl font-bold text-primary">{profileToDisplay.itemsSold || 0}</p>
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
                Preferências de Marketing: {profileToDisplay.optInMarketing ? "Você optou por receber comunicações de marketing." : "Você optou por não receber comunicações de marketing."}
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

    
