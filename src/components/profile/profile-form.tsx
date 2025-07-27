
// src/components/profile/profile-form.tsx
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { UserProfileData, EditableUserProfileData } from '@/types';
import { profileFormSchema, type ProfileFormValues } from './profile-form-schema';

import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, CalendarIcon, UserCog, Building } from 'lucide-react';

interface ProfileFormProps {
  initialData: UserProfileData;
  onSubmitAction: (data: EditableUserProfileData) => Promise<{ success: boolean; message: string }>;
  context: 'admin' | 'user';
}

const genderOptions = ["Masculino", "Feminino", "Outro", "Prefiro não informar"];
const maritalStatusOptions = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"];
const propertyRegimeOptions = ["Comunhão Parcial de Bens", "Comunhão Universal de Bens", "Separação Total de Bens", "Participação Final nos Aquestos"];

export default function ProfileForm({ initialData, onSubmitAction, context }: ProfileFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      email: initialData?.email || '',
      password: '',
      cpf: initialData?.cpf || '',
      cellPhone: initialData?.cellPhone || '',
      homePhone: initialData?.homePhone || '',
      dateOfBirth: initialData?.dateOfBirth ? new Date(initialData.dateOfBirth) : null,
      accountType: initialData?.accountType || 'PHYSICAL',
      razaoSocial: initialData?.razaoSocial || '',
      cnpj: initialData?.cnpj || '',
      responsibleName: initialData?.responsibleName || '',
      responsibleCpf: initialData?.responsibleCpf || '',
      zipCode: initialData?.zipCode || '',
      street: initialData?.street || '',
      number: initialData?.number || '',
      complement: initialData?.complement || '',
      neighborhood: initialData?.neighborhood || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      optInMarketing: initialData?.optInMarketing || false,
    },
  });

  const accountType = form.watch("accountType");

  async function onSubmit(values: ProfileFormValues) {
    setIsSubmitting(true);
    const result = await onSubmitAction(values as EditableUserProfileData);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      if (context === 'user') {
        router.push('/profile');
      } else {
        router.refresh();
      }
    } else {
      toast({ title: "Erro ao atualizar", description: result.message, variant: "destructive" });
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold font-headline flex items-center">
          <UserCog className="h-7 w-7 mr-3 text-primary" />
          {context === 'admin' ? 'Editar Perfil do Usuário' : 'Meu Perfil'}
        </CardTitle>
        <CardDescription>
          {context === 'admin' ? `Editando informações de ${initialData.fullName || initialData.email}.` : 'Atualize suas informações pessoais e de contato.'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 bg-secondary/30 p-6">
            <h3 className="text-lg font-semibold text-primary border-b pb-2">Informações da Conta</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" readOnly disabled {...field} className="cursor-not-allowed bg-muted/70" /></FormControl><FormDescription>O email não pode ser alterado.</FormDescription></FormItem>)} />
              {context === 'admin' && (
                <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Nova Senha</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormDescription>Deixe em branco para não alterar.</FormDescription><FormMessage /></FormItem>)} />
              )}
            </div>

            <Separator />

            {accountType === 'LEGAL' ? (
                 <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary border-b pb-2 flex items-center gap-2"><Building/>Dados da Pessoa Jurídica</h3>
                    <FormField control={form.control} name="razaoSocial" render={({ field }) => (<FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                     <div className="grid md:grid-cols-2 gap-4">
                         <FormField control={form.control} name="cnpj" render={({ field }) => (<FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                         <FormField control={form.control} name="responsibleName" render={({ field }) => (<FormItem><FormLabel>Nome do Responsável</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                     </div>
                 </section>
            ) : (
                 <section className="space-y-4">
                     <h3 className="text-lg font-semibold text-primary border-b pb-2">Informações Pessoais</h3>
                    <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                     <div className="grid md:grid-cols-2 gap-4">
                         <FormField control={form.control} name="cpf" render={({ field }) => (<FormItem><FormLabel>CPF</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                         <FormField control={form.control} name="dateOfBirth" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data de Nascimento</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} captionLayout="dropdown-buttons" fromYear={1920} toYear={new Date().getFullYear() - 18} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                     </div>
                 </section>
            )}

            <Separator/>
             <section className="space-y-4">
                <h3 className="text-lg font-semibold text-primary border-b pb-2">Endereço e Contato</h3>
                 <div className="grid md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="cellPhone" render={({ field }) => (<FormItem><FormLabel>Celular</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="zipCode" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                 </div>
                  <FormField control={form.control} name="street" render={({ field }) => (<FormItem><FormLabel>Logradouro</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid md:grid-cols-3 gap-4">
                     <FormField control={form.control} name="number" render={({ field }) => (<FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="complement" render={({ field }) => (<FormItem><FormLabel>Complemento</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="neighborhood" render={({ field }) => (<FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                   <div className="grid md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                   </div>
             </section>
          </CardContent>
          <CardFooter className="flex justify-end p-6 border-t">
            <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar Alterações
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
