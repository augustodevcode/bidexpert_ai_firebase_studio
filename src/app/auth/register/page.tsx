'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserPlus, CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createUser } from '@/app/admin/users/actions';
import type { UserCreationData } from '@/app/admin/users/actions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { registrationFormSchema, type RegistrationFormValues } from './form-schema';
import DocumentUploadCard from '@/components/document-upload-card';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State to hold files selected by the user
  const [documentFiles, setDocumentFiles] = useState<Record<string, File | null>>({});

  const handleFileSelect = (docType: string, file: File | null) => {
    setDocumentFiles(prev => ({ ...prev, [docType]: file }));
  };
  
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      accountType: 'PHYSICAL',
      email: '',
      emailConfirmation: '',
      cellPhone: '',
      cellPhoneConfirmation: '',
      password: '',
      passwordConfirmation: '',
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      termsAccepted: false,
      optInMarketing: false,
      fullName: '',
      cpf: '',
      dateOfBirth: undefined,
      razaoSocial: '',
      cnpj: '',
      inscricaoEstadual: '',
      websiteComitente: '',
      responsibleName: '',
      responsibleCpf: '',
    },
  });

  const accountType = useWatch({
    control: form.control,
    name: 'accountType',
  });

  async function uploadDocuments(userId: string): Promise<Record<string, string>> {
      const uploadedDocumentUrls: Record<string, string> = {};
      const filesToUpload = Object.entries(documentFiles).filter(([_, file]) => file !== null);

      for (const [docType, file] of filesToUpload) {
          if (file) {
              const formData = new FormData();
              formData.append('file', file);
              formData.append('userId', userId);
              formData.append('docType', docType);

              try {
                  const response = await fetch('/api/upload/document', {
                      method: 'POST',
                      body: formData,
                  });
                  const result = await response.json();
                  if (response.ok && result.success) {
                      uploadedDocumentUrls[docType] = result.publicUrl;
                  } else {
                      throw new Error(result.message || `Falha ao enviar ${docType}`);
                  }
              } catch (uploadError: any) {
                  console.error(`Error uploading ${docType}:`, uploadError);
                  toast({
                      title: `Erro no Upload do Documento`,
                      description: `Falha ao enviar o arquivo para ${docType}: ${uploadError.message}`,
                      variant: "destructive",
                  });
              }
          }
      }
      return uploadedDocumentUrls;
  }

  async function onSubmit(data: RegistrationFormValues) {
    setError(null);
    setIsLoading(true);

    const creationData: UserCreationData = {
      email: data.email.trim(),
      fullName: data.accountType === 'PHYSICAL' ? data.fullName?.trim() : data.razaoSocial?.trim(),
      password: data.password,
      accountType: data.accountType,
      cpf: data.accountType === 'PHYSICAL' ? data.cpf?.trim() : data.responsibleCpf?.trim(),
      dateOfBirth: data.accountType === 'PHYSICAL' ? data.dateOfBirth : null,
      razaoSocial: data.accountType !== 'PHYSICAL' ? data.razaoSocial?.trim() : undefined,
      cnpj: data.accountType !== 'PHYSICAL' ? data.cnpj?.trim() : undefined,
      inscricaoEstadual: data.accountType !== 'PHYSICAL' ? data.inscricaoEstadual?.trim() : undefined,
      website: data.accountType === 'DIRECT_SALE_CONSIGNOR' ? data.websiteComitente?.trim() : undefined,
      cellPhone: data.cellPhone.trim(),
      zipCode: data.zipCode?.trim(),
      street: data.street?.trim(),
      number: data.number?.trim(),
      complement: data.complement?.trim(),
      neighborhood: data.neighborhood?.trim(),
      city: data.city?.trim(),
      state: data.state?.trim(),
      optInMarketing: data.optInMarketing,
    };
    
    try {
      const result = await createUser(creationData);

      if (result.success && result.userId) {
        toast({
          title: "Cadastro realizado!",
          description: "Enviando seus documentos, por favor aguarde...",
        });
        
        await uploadDocuments(result.userId);
        
        toast({
            title: "Tudo pronto!",
            description: "Seu cadastro foi realizado com sucesso. Você será redirecionado para o login.",
            variant: "default",
        });

        router.push('/auth/login');

      } else {
        setError(result.message);
        toast({ title: "Erro no Registro", description: result.message, variant: "destructive" });
      }
    } catch (e: any) {
      setError(e.message || 'Falha ao registrar. Tente novamente.');
      toast({ title: "Erro no Registro", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="text-center">
          <UserPlus className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-2xl font-bold font-headline">Criar uma Conta</CardTitle>
          <CardDescription>Junte-se ao BidExpert para começar a dar lances e vender.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 bg-secondary/30 p-6">
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base">Tipo de Cadastro</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-4">
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl><RadioGroupItem value="PHYSICAL" /></FormControl>
                          <FormLabel className="font-normal cursor-pointer">Pessoa Física</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl><RadioGroupItem value="LEGAL" /></FormControl>
                          <FormLabel className="font-normal cursor-pointer">Pessoa Jurídica</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl><RadioGroupItem value="DIRECT_SALE_CONSIGNOR" /></FormControl>
                          <FormLabel className="font-normal cursor-pointer">Comitente Venda Direta</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {accountType === 'PHYSICAL' && (
                <>
                  <Separator />
                  <h3 className="text-md font-semibold text-muted-foreground">Dados Pessoais</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Nome Completo*</FormLabel><FormControl><Input placeholder="Nome Completo" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="cpf" render={({ field }) => (<FormItem><FormLabel>CPF*</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="dateOfBirth" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data de Nascimento*</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear() - 18} /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                </>
              )}

              {(accountType === 'LEGAL' || accountType === 'DIRECT_SALE_CONSIGNOR') && (
                <>
                  <Separator />
                  <h3 className="text-md font-semibold text-muted-foreground">Dados da Empresa</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="razaoSocial" render={({ field }) => (<FormItem><FormLabel>Razão Social*</FormLabel><FormControl><Input placeholder="Nome da Empresa Ltda." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="cnpj" render={({ field }) => (<FormItem><FormLabel>CNPJ*</FormLabel><FormControl><Input placeholder="00.000.000/0001-00" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="inscricaoEstadual" render={({ field }) => (<FormItem><FormLabel>Inscrição Estadual (Opcional)</FormLabel><FormControl><Input placeholder="Número da Inscrição Estadual" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  {accountType === 'DIRECT_SALE_CONSIGNOR' && (<FormField control={form.control} name="websiteComitente" render={({ field }) => (<FormItem><FormLabel>Website (Opcional)</FormLabel><FormControl><Input type="url" placeholder="www.suaempresa.com.br" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />)}
                  <Separator />
                  <h3 className="text-md font-semibold text-muted-foreground">Responsável Legal</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <FormField control={form.control} name="responsibleName" render={({ field }) => (<FormItem><FormLabel>Nome Completo*</FormLabel><FormControl><Input placeholder="Nome do responsável" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="responsibleCpf" render={({ field }) => (<FormItem><FormLabel>CPF*</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                </>
              )}

              <Separator />
              <h3 className="text-md font-semibold text-muted-foreground">Informações de Contato e Acesso</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="cellPhone" render={({ field }) => (<FormItem><FormLabel>Telefone Celular*</FormLabel><FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="cellPhoneConfirmation" render={({ field }) => (<FormItem><FormLabel>Confirmar Celular*</FormLabel><FormControl><Input placeholder="Repita o celular" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email*</FormLabel><FormControl><Input type="email" placeholder="seu@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="emailConfirmation" render={({ field }) => (<FormItem><FormLabel>Confirmar Email*</FormLabel><FormControl><Input type="email" placeholder="Repita o email" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Senha*</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="passwordConfirmation" render={({ field }) => (<FormItem><FormLabel>Confirmar Senha*</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>

              <Separator />
              <h3 className="text-md font-semibold text-muted-foreground">Endereço</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="zipCode" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="street" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel>Logradouro (Rua/Avenida)</FormLabel><FormControl><Input placeholder="Ex: Rua das Palmeiras" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField control={form.control} name="number" render={({ field }) => (<FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="Ex: 123" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="complement" render={({ field }) => (<FormItem><FormLabel>Complemento</FormLabel><FormControl><Input placeholder="Ex: Ap 101, Bloco B" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="neighborhood" render={({ field }) => (<FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Ex: Centro" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="Ex: Salvador" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>Estado (UF)</FormLabel><FormControl><Input placeholder="Ex: BA" maxLength={2} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              </div>

              <Separator />
              <div className="space-y-2 pt-4">
                <FormField control={form.control} name="termsAccepted" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel className="text-xs cursor-pointer">Li e aceito os <Link href="/terms" className="underline text-primary hover:text-primary/80">Termos de Uso</Link> e a <Link href="/privacy" className="underline text-primary hover:text-primary/80">Política de Privacidade</Link>.*</FormLabel></div></FormItem>)} />
                <FormField control={form.control} name="optInMarketing" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel className="text-xs cursor-pointer">Desejo receber e-mails sobre promoções e novidades do BidExpert.</FormLabel></div></FormItem>)} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 p-6 border-t">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Registrar'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Já tem uma conta?{' '}
                <Link href="/auth/login" className="font-medium text-primary hover:underline">
                  Login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}