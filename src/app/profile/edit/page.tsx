
'use client';

import { useState, useEffect, type FormEvent } from 'react';
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
import { updateUserProfile, type EditableUserProfileData } from './actions';
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


export default function EditProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true); // Start true to show loader initially
  const [fetchError, setFetchError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: '',
      cpf: '',
      rgNumber: '',
      rgIssuer: '',
      rgIssueDate: null,
      rgState: '',
      dateOfBirth: null,
      cellPhone: '',
      homePhone: '',
      gender: '',
      profession: '',
      nationality: '',
      maritalStatus: '',
      propertyRegime: '',
      spouseName: '',
      spouseCpf: '',
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      optInMarketing: false,
    },
  });

  useEffect(() => {
    const fetchProfileData = async (uid: string) => {
      setIsFetchingData(true);
      setFetchError(null);
      console.log('Attempting to fetch profile for UID:', uid);
      try {
        const userDocRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfileData;
          form.reset({
            fullName: data.fullName || '',
            cpf: data.cpf || '',
            rgNumber: data.rgNumber || '',
            rgIssuer: data.rgIssuer || '',
            rgIssueDate: data.rgIssueDate?.toDate ? data.rgIssueDate.toDate() : null,
            rgState: data.rgState || '',
            dateOfBirth: data.dateOfBirth?.toDate ? data.dateOfBirth.toDate() : null,
            cellPhone: data.cellPhone || '',
            homePhone: data.homePhone || '',
            gender: data.gender || '',
            profession: data.profession || '',
            nationality: data.nationality || '',
            maritalStatus: data.maritalStatus || '',
            propertyRegime: data.propertyRegime || '',
            spouseName: data.spouseName || '',
            spouseCpf: data.spouseCpf || '',
            zipCode: data.zipCode || '',
            street: data.street || '',
            number: data.number || '',
            complement: data.complement || '',
            neighborhood: data.neighborhood || '',
            city: data.city || '',
            state: data.state || '',
            optInMarketing: data.optInMarketing || false,
          });
        } else {
          console.error('Profile not found in Firestore for UID:', uid);
          setFetchError("Perfil não encontrado no banco de dados.");
          toast({ title: "Erro", description: "Perfil não encontrado no banco de dados.", variant: "destructive" });
        }
      } catch (e: any) {
        console.error("Error fetching user profile for edit:", e);
        setFetchError("Erro ao buscar dados do perfil para edição.");
        toast({ title: "Erro", description: `Não foi possível carregar os dados do perfil: ${e.message}`, variant: "destructive" });
      } finally {
        setIsFetchingData(false);
      }
    };

    if (authLoading) {
      setIsFetchingData(true); // Keep showing loader if auth is still loading
      return;
    }

    if (!user) {
      toast({ title: "Acesso Negado", description: "Você precisa estar logado para editar o perfil.", variant: "destructive" });
      router.push('/auth/login');
      setIsFetchingData(false); // Stop fetching if no user
      return;
    }

    if (user && user.uid) {
      fetchProfileData(user.uid);
    } else {
      // This case should ideally not be reached if authLoading is false and user is null (handled above)
      // But as a safeguard:
      console.error("User object or UID is not available after auth loading finished.");
      setFetchError("Não foi possível obter informações do usuário.");
      toast({ title: "Erro", description: "Não foi possível obter informações do usuário.", variant: "destructive" });
      setIsFetchingData(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router, form.reset, toast]); // form.reset added to dependencies

  async function onSubmit(data: ProfileFormValues) {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    const dataToUpdate: EditableUserProfileData = {
      ...data,
      dateOfBirth: data.dateOfBirth instanceof Date ? data.dateOfBirth : null,
      rgIssueDate: data.rgIssueDate instanceof Date ? data.rgIssueDate : null,
    };

    const result = await updateUserProfile(user.uid, dataToUpdate);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/profile'); 
    } else {
      toast({ title: "Erro ao atualizar", description: result.message, variant: "destructive" });
    }
  }

  if (authLoading || isFetchingData) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Carregando dados do perfil...</p>
      </div>
    );
  }

  if (fetchError && !form.formState.isDirty) { // Show error only if form hasn't been touched yet
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-destructive">{fetchError}</h2>
        <Button asChild className="mt-4">
          <Link href="/profile">Voltar ao Perfil</Link>
        </Button>
         <Button variant="outline" onClick={() => user && user.uid && (form.reset(), useEffect(() => { /* re-trigger fetch */ }, [user, authLoading]))} className="mt-4 ml-2">
          Tentar Novamente
        </Button>
      </div>
    );
  }
  
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
              <Button type="submit" disabled={isSubmitting || isFetchingData || authLoading} className="w-full md:w-auto">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Alterações
              </Button>
               <Button variant="outline" asChild className="ml-auto">
                  <Link href="/profile">Cancelar</Link>
                </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
