// src/app/auth/register/page.tsx
/**
 * @fileoverview Página de Registro de Novos Usuários.
 * Este componente de cliente gerencia o formulário de registro, que é dinâmico
 * e se adapta ao tipo de conta selecionado (Pessoa Física ou Jurídica).
 * Ele utiliza `react-hook-form` e `zod` para validação de dados em tempo real,
 * lida com o upload de documentos de habilitação e chama a server action
 * `createUser` para efetivar o cadastro do novo usuário no sistema.
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserPlus, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createUser, associateContactMessages } from '@/app/admin/users/actions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { registrationFormSchema, type RegistrationFormValues } from './form-schema';
import DocumentUploadCard from '@/components/document-upload-card';
import type { UserCreationData } from '@/types';
// Removed: import { UserContactAssociationService } from '@/services/user-contact-association.service';

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
    mode: 'onChange', // Validate on change to enable/disable submit button
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
      website: '',
      responsibleName: '',
      responsibleCpf: '',
    },
  });
  
  const { formState } = form; // Get form state to check for validity

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
      website: data.accountType === 'DIRECT_SALE_CONSIGNOR' ? data.website?.trim() : undefined,
      cellPhone: data.cellPhone.trim(),
      zipCode: data.zipCode?.trim(),
      street: data.street?.trim(),
      number: data.number?.trim(),
      complement: data.complement?.trim(),
      neighborhood: data.neighborhood?.trim(),
      city: data.city?.trim(),
      state: data.state?.trim(),
      optInMarketing: data.optInMarketing,
      roleIds: [], // Roles são atribuídas pelo backend
    };
    
    try {
      const result = await createUser(creationData);

      if (result.success && result.userId) {
        // Associar mensagens de contato anônimas ao novo usuário
        try {
          const associatedCount = await associateContactMessages(result.userId, data.email.trim());
          
          if (associatedCount > 0) {
            console.log(`Associadas ${associatedCount} mensagens de contato ao usuário ${result.userId}`);
          }
        } catch (associationError) {
          console.error('Erro ao associar mensagens de contato:', associationError);
          // Não falha o cadastro por causa disso
        }

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
    <div data-ai-id="auth-register-page-container" className="wrapper-auth-page-large">
      <Card data-ai-id="auth-register-card" className="card-auth-large">
        <CardHeader className="header-auth">
          <UserPlus className="icon-auth-header" />
          <CardTitle className="title-auth">Criar uma Conta</CardTitle>
          <CardDescription className="desc-auth">Junte-se ao BidExpert para começar a dar lances e vender.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form data-ai-id="auth-register-form" onSubmit={form.handleSubmit(onSubmit)} className="form-auth">
            <CardContent className="content-auth-shaded">
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem className="wrapper-account-type-selection">
                    <FormLabel className="label-account-type">Tipo de Cadastro<span className="text-auth-required">*</span></FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="group-account-type-radio">
                        <FormItem className="wrapper-account-type-option">
                          <FormControl><RadioGroupItem value="PHYSICAL" /></FormControl>
                          <FormLabel className="label-account-type-option">Pessoa Física</FormLabel>
                        </FormItem>
                        <FormItem className="wrapper-account-type-option">
                          <FormControl><RadioGroupItem value="LEGAL" /></FormControl>
                          <FormLabel className="label-account-type-option">Pessoa Jurídica</FormLabel>
                        </FormItem>
                        <FormItem className="wrapper-account-type-option">
                          <FormControl><RadioGroupItem value="DIRECT_SALE_CONSIGNOR" /></FormControl>
                          <FormLabel className="label-account-type-option">Comitente Venda Direta</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {accountType === 'PHYSICAL' && (
                <div data-ai-id="register-physical-person-section" className="wrapper-register-section">
                  <Separator className="separator-auth" />
                  <h3 className="header-register-section">Dados Pessoais</h3>
                  <div className="grid-register-fields">
                    <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">Nome Completo<span className="text-auth-required">*</span></FormLabel><FormControl><Input placeholder="Nome Completo" {...field} value={field.value ?? ''} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="cpf" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">CPF<span className="text-auth-required">*</span></FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} value={field.value ?? ''} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="dateOfBirth" render={({ field }) => (<FormItem className="wrapper-form-item-column"><FormLabel className="label-auth-field">Data de Nascimento<span className="text-auth-required">*</span></FormLabel><FormControl><DatePicker date={field.value} onSelect={field.onChange} placeholder="Selecione uma data" fromYear={1900} toYear={new Date().getFullYear() - 18} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              )}

              {(accountType === 'LEGAL' || accountType === 'DIRECT_SALE_CONSIGNOR') && (
                <div data-ai-id="register-legal-person-section" className="wrapper-register-section">
                  <Separator className="separator-auth" />
                  <h3 className="header-register-section">Dados da Empresa</h3>
                  <div className="grid-register-fields">
                    <FormField control={form.control} name="razaoSocial" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">Razão Social<span className="text-auth-required">*</span></FormLabel><FormControl><Input placeholder="Nome da Empresa Ltda." {...field} value={field.value ?? ''} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="cnpj" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">CNPJ<span className="text-auth-required">*</span></FormLabel><FormControl><Input placeholder="00.000.000/0001-00" {...field} value={field.value ?? ''} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="inscricaoEstadual" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">Inscrição Estadual (Opcional)</FormLabel><FormControl><Input placeholder="Número da Inscrição Estadual" {...field} value={field.value ?? ''} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                  {accountType === 'DIRECT_SALE_CONSIGNOR' && (<FormField control={form.control} name="website" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">Website (Opcional)</FormLabel><FormControl><Input type="url" placeholder="www.suaempresa.com.br" {...field} value={field.value ?? ''} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />)}
                  <Separator className="separator-auth" />
                  <h3 className="header-register-section">Responsável Legal</h3>
                  <div className="grid-register-fields">
                     <FormField control={form.control} name="responsibleName" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">Nome Completo<span className="text-auth-required">*</span></FormLabel><FormControl><Input placeholder="Nome do responsável" {...field} value={field.value ?? ''} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="responsibleCpf" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">CPF<span className="text-auth-required">*</span></FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} value={field.value ?? ''} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                </div>
              )}

              <div data-ai-id="register-contact-section" className="wrapper-register-section">
                <Separator className="separator-auth" />
                <h3 className="header-register-section">Informações de Contato e Acesso</h3>
                <div className="grid-register-fields">
                  <FormField control={form.control} name="cellPhone" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">Telefone Celular<span className="text-auth-required">*</span></FormLabel><FormControl><Input placeholder="(00) 00000-0000" {...field} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="cellPhoneConfirmation" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">Confirmar Celular<span className="text-auth-required">*</span></FormLabel><FormControl><Input placeholder="Repita o celular" {...field} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid-register-fields">
                  <FormField control={form.control} name="email" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">Email<span className="text-auth-required">*</span></FormLabel><FormControl><Input type="email" placeholder="seu@email.com" {...field} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="emailConfirmation" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">Confirmar Email<span className="text-auth-required">*</span></FormLabel><FormControl><Input type="email" placeholder="Repita o email" {...field} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid-register-fields">
                  <FormField control={form.control} name="password" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">Senha<span className="text-auth-required">*</span></FormLabel><FormControl><Input type="password" {...field} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="passwordConfirmation" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">Confirmar Senha<span className="text-auth-required">*</span></FormLabel><FormControl><Input type="password" {...field} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </div>
              
              <div data-ai-id="register-address-section" className="wrapper-register-section">
                <Separator className="separator-auth" />
                <h3 className="header-register-section">Endereço</h3>
                <div className="grid-register-fields">
                  <FormField control={form.control} name="zipCode" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} value={field.value ?? ''} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="street" render={({ field }) => (<FormItem className="wrapper-form-item-span"><FormLabel className="label-auth-field">Logradouro (Rua/Avenida)</FormLabel><FormControl><Input placeholder="Ex: Rua das Palmeiras" {...field} value={field.value ?? ''} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid-register-fields-three">
                  <FormField control={form.control} name="number" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">Número</FormLabel><FormControl><Input placeholder="Ex: 123" {...field} value={field.value ?? ''} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="complement" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">Complemento</FormLabel><FormControl><Input placeholder="Ex: Ap 101, Bloco B" {...field} value={field.value ?? ''} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="neighborhood" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">Bairro</FormLabel><FormControl><Input placeholder="Ex: Centro" {...field} value={field.value ?? ''} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid-register-fields">
                  <FormField control={form.control} name="city" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">Cidade</FormLabel><FormControl><Input placeholder="Ex: Salvador" {...field} value={field.value ?? ''} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="state" render={({ field }) => (<FormItem className="wrapper-form-item"><FormLabel className="label-auth-field">Estado (UF)</FormLabel><FormControl><Input placeholder="Ex: BA" maxLength={2} {...field} value={field.value ?? ''} className="input-auth-field" /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </div>

              <div data-ai-id="register-terms-section" className="wrapper-register-section">
                <Separator className="separator-auth" />
                <div className="wrapper-terms-options">
                  <FormField control={form.control} name="termsAccepted" render={({ field }) => (<FormItem className="item-terms-checkbox"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="checkbox-auth-terms" /></FormControl><div className="wrapper-terms-label"><FormLabel className="label-terms-text">Li e aceito os <Link href="/terms" className="link-terms-primary">Termos de Uso</Link> e a <Link href="/privacy" className="link-terms-primary">Política de Privacidade</Link>.<span className="text-auth-required">*</span></FormLabel></div></FormItem>)} />
                  <FormField control={form.control} name="optInMarketing" render={({ field }) => (<FormItem className="item-terms-checkbox"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="checkbox-auth-marketing" /></FormControl><div className="wrapper-terms-label"><FormLabel className="label-terms-text">Desejo receber e-mails sobre promoções e novidades do BidExpert.</FormLabel></div></FormItem>)} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="footer-auth-register">
              <Button type="submit" className="btn-auth-submit" disabled={isLoading || !formState.isValid} data-ai-id="auth-register-submit-btn">
                {isLoading ? <Loader2 className="icon-btn-spinner" /> : 'Registrar'}
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
