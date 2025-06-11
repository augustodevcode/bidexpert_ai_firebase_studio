
'use client';

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation'; 
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { updateUserProfile, type EditableUserProfileData } from './edit/actions'; // CORRIGIDO CAMINHO
import type { UserProfileData } from '@/types';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Save, CalendarIcon, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

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
    console.log('[ProfilePage fetchProfileData] Attempting for UID:', uid);
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
        console.log(`[ProfilePage fetchProfileData] Firestore Profile found:`, processedData.email);
      } else {
        setErrorPage("Perfil não encontrado no banco de dados Firestore.");
        console.error(`[ProfilePage fetchProfileData] Firestore Profile not found for UID: ${uid}`);
        setProfileToDisplay(null);
      }
    } catch (e: any) {
      setErrorPage("Erro ao buscar dados do perfil do Firestore.");
      console.error(`[ProfilePage fetchProfileData] Error fetching Firestore profile:`, e);
      setProfileToDisplay(null);
    } finally {
      setIsLoadingPage(false);
    }
  }, [authUser, form]); 

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
        console.log("[ProfilePage useEffect - FIRESTORE] User not authenticated. Redirecting to login.");
        setErrorPage("Usuário não autenticado. Por favor, faça login.");
        router.push('/auth/login?redirect=/profile');
        setIsLoadingPage(false);
        return;
      }
      fetchProfileData(authUser.uid);
    } else { 
      console.log("[ProfilePage useEffect - SQL] Using userProfileWithPermissions from context.");
      if (userProfileWithPermissions) {
         console.log("[ProfilePage useEffect - SQL] Profile data from context:", userProfileWithPermissions.email);
        const processedProfile = {
          ...userProfileWithPermissions,
          dateOfBirth: userProfileWithPermissions.dateOfBirth ? new Date(userProfileWithPermissions.dateOfBirth) : null,
          rgIssueDate: userProfileWithPermissions.rgIssueDate ? new Date(userProfileWithPermissions.rgIssueDate) : null,
          createdAt: userProfileWithPermissions.createdAt ? new Date(userProfileWithPermissions.createdAt) : undefined,
          updatedAt: userProfileWithPermissions.updatedAt ? new Date(userProfileWithPermissions.updatedAt) : undefined,
        };
        setProfileToDisplay(processedProfile as UserProfileData);
        form.reset(processedProfile as ProfileFormValues);
        setIsLoadingPage(false);
      } else {
        console.log("[ProfilePage useEffect - SQL] userProfileWithPermissions is null. Setting error and redirecting.");
        setErrorPage("Usuário não autenticado. Por favor, faça login.");
        router.push('/auth/login?redirect=/profile');
        setIsLoadingPage(false);
      }
    }
  }, [authUser, userProfileWithPermissions, authContextLoading, fetchProfileData, router]);
  
  const handleRetryFetch = useCallback(() => {
    setErrorPage(null); 
    setIsLoadingPage(true); 
    if (activeSystem === 'FIRESTORE' && authUser?.uid) {
      fetchProfileData(authUser.uid);
    } else if (activeSystem !== 'FIRESTORE') {
       // For SQL, if userProfileWithPermissions is missing, AuthProvider should redirect.
       // If it's present, useEffect above will use it. This retry is mostly for Firestore scenarios.
       // If userProfileWithPermissions became null unexpectedly, it might trigger a re-fetch via useEffect dependency changes.
      if(userProfileWithPermissions) {
        const processedProfile = {
          ...userProfileWithPermissions,
          dateOfBirth: userProfileWithPermissions.dateOfBirth ? new Date(userProfileWithPermissions.dateOfBirth) : null,
          rgIssueDate: userProfileWithPermissions.rgIssueDate ? new Date(userProfileWithPermissions.rgIssueDate) : null,
        };
        setProfileToDisplay(processedProfile as UserProfileData);
        form.reset(processedProfile as ProfileFormValues);
        setIsLoadingPage(false);
      } else {
        router.push('/auth/login?redirect=/profile'); // Ensure redirection if no profile
        setIsLoadingPage(false);
      }
    }
  }, [activeSystem, authUser, userProfileWithPermissions, fetchProfileData, router, form]);

  async function onSubmit(data: ProfileFormValues) {
    const userId = activeSystem === 'FIRESTORE' ? authUser?.uid : userProfileWithPermissions?.uid;
    if (!userId) {
      toast({ title: "Erro", description: "ID do usuário não encontrado para atualização.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    const dataToUpdate: EditableUserProfileData = {
      ...data,
      dateOfBirth: data.dateOfBirth instanceof Date ? data.dateOfBirth : null,
      rgIssueDate: data.rgIssueDate instanceof Date ? data.rgIssueDate : null,
    };

    const result = await updateUserProfile(userId, dataToUpdate);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      // No redirect needed here, just refresh data if necessary or rely on context update
      // router.push('/profile'); 
      // router.refresh(); 
      // For SQL, we might need to re-fetch the profile from the DB and update AuthContext
      // For Firestore, onAuthStateChanged and ensureUserProfileInDb might re-fetch.
      // For now, let's assume a manual refresh of the page or re-login might be needed for SQL to see updates immediately.
      // Or better: AuthContext should have a way to force-refresh its userProfileWithPermissions
    } else {
      toast({ title: "Erro ao atualizar", description: result.message, variant: "destructive" });
    }
  }

  if (isLoadingPage || authContextLoading) { 
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
            onClick={handleRetryFetch} 
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
  const currentMaritalStatus = form.watch("maritalStatus");
  const showSpouseFields = currentMaritalStatus === "Casado(a)" || currentMaritalStatus === "União Estável";

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <UserCog className="h-7 w-7 mr-3 text-primary" /> Editar Perfil
          </CardTitle>
          <CardDescription>Atualize suas informações pessoais e de contato.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              
              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-primary border-b pb-2">Informações Pessoais</h3>
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl><Input {...field} placeholder="000.000.000-00" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Nascimento</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                              >
                                {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                              initialFocus
                              captionLayout="dropdown-buttons"
                              fromYear={1920}
                              toYear={new Date().getFullYear() - 18}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cellPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Celular</FormLabel>
                        <FormControl><Input {...field} placeholder="(00) 00000-0000" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="homePhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone Residencial (Opcional)</FormLabel>
                        <FormControl><Input {...field} placeholder="(00) 0000-0000" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Gênero (Opcional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione seu gênero" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {genderOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="profession"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Profissão (Opcional)</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="nationality"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nacionalidade (Opcional)</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="maritalStatus"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estado Civil (Opcional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione seu estado civil" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {maritalStatusOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                 {showSpouseFields && (
                    <>
                        <FormField
                            control={form.control}
                            name="propertyRegime"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Regime de Bens (Opcional)</FormLabel>
                                 <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione o regime de bens" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {propertyRegimeOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="spouseName"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Cônjuge (Opcional)</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="spouseCpf"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CPF do Cônjuge (Opcional)</FormLabel>
                                    <FormControl><Input {...field} placeholder="000.000.000-00" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                    </>
                )}
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-primary border-b pb-2">Documentos (RG)</h3>
                 <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="rgNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Número do RG (Opcional)</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="rgIssuer"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Órgão Emissor do RG (Opcional)</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>
                 <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="rgState"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>UF Emissor do RG (Opcional)</FormLabel>
                            <FormControl><Input {...field} maxLength={2} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="rgIssueDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Data de Emissão do RG (Opcional)</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                    {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                initialFocus
                                captionLayout="dropdown-buttons"
                                fromYear={1950}
                                toYear={new Date().getFullYear()}
                                />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-primary border-b pb-2">Endereço (Opcional)</h3>
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl><Input {...field} placeholder="00000-000" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid md:grid-cols-3 gap-4">
                   <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Logradouro</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="complement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado (UF)</FormLabel>
                        <FormControl><Input {...field} maxLength={2} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <section>
                 <h3 className="text-lg font-semibold text-primary border-b pb-2">Preferências</h3>
                <FormField
                  control={form.control}
                  name="optInMarketing"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm mt-4">
                      <div className="space-y-0.5">
                        <FormLabel>Comunicações de Marketing</FormLabel>
                        <FormDescription>
                          Desejo receber e-mails sobre promoções e novidades do BidExpert.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </section>

            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="submit" disabled={isSubmitting || isLoadingPage || authContextLoading} className="w-full md:w-auto">
                <span className="flex items-center justify-center">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Alterações
                </span>
              </Button>
               <Button variant="outline" asChild className="ml-auto">
                  <Link href="/profile" legacyBehavior passHref>
                    <a><span>Cancelar</span></a>
                  </Link>
                </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

    
