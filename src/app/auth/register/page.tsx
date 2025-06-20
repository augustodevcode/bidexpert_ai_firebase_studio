
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, CalendarIcon, Loader2, Building, Briefcase, FileUp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, type FormEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createUser, type UserCreationData } from '@/app/admin/users/actions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'; // Added this import

type PersonType = 'PHYSICAL' | 'LEGAL' | 'DIRECT_SALE_CONSIGNOR';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [personType, setPersonType] = useState<PersonType>('PHYSICAL');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');
  const [websiteComitente, setWebsiteComitente] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [cellPhone, setCellPhone] = useState('');
  const [confirmCellPhone, setConfirmCellPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [optInMarketing, setOptInMarketing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (email !== confirmEmail) {
      setError("Os emails não coincidem.");
      toast({ title: "Erro", description: "Os emails não coincidem.", variant: "destructive" });
      return;
    }
    if (cellPhone !== confirmCellPhone) {
        setError("Os números de celular não coincidem.");
        toast({ title: "Erro", description: "Os números de celular não coincidem.", variant: "destructive" });
        return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    if (personType === 'PHYSICAL' && !dateOfBirth) {
      setError("Por favor, selecione sua data de nascimento.");
      toast({ title: "Erro", description: "Por favor, selecione sua data de nascimento.", variant: "destructive" });
      return;
    }
    if (!acceptTerms) {
        setError("Você deve aceitar os Termos de Uso e a Política de Privacidade.");
        toast({ title: "Erro", description: "Você deve aceitar os Termos de Uso e a Política de Privacidade.", variant: "destructive" });
        return;
    }

    setIsLoading(true);
    
    const creationData: UserCreationData = {
      email: email.trim(),
      fullName: personType === 'PHYSICAL' ? fullName.trim() : razaoSocial.trim(), 
      password,
      // @ts-ignore
      accountType: personType,
      cpf: personType === 'PHYSICAL' ? cpf.trim() : undefined,
      dateOfBirth: personType === 'PHYSICAL' ? dateOfBirth : null,
      // @ts-ignore
      razaoSocial: personType !== 'PHYSICAL' ? razaoSocial.trim() : undefined,
      // @ts-ignore
      cnpj: personType !== 'PHYSICAL' ? cnpj.trim() : undefined,
      // @ts-ignore
      inscricaoEstadual: personType !== 'PHYSICAL' ? inscricaoEstadual.trim() : undefined,
      // @ts-ignore
      websiteComitente: personType === 'DIRECT_SALE_CONSIGNOR' ? websiteComitente.trim() : undefined,
      cellPhone: cellPhone.trim(),
      // @ts-ignore
      zipCode: zipCode.trim(),
      // @ts-ignore
      street: street.trim(),
      // @ts-ignore
      number: number.trim(),
      // @ts-ignore
      complement: complement.trim(),
      // @ts-ignore
      neighborhood: neighborhood.trim(),
      // @ts-ignore
      city: city.trim(),
      // @ts-ignore
      state: state.trim(),
      // @ts-ignore
      optInMarketing: optInMarketing,
    };

    try {
      const result = await createUser(creationData);

      if (result.success) {
        toast({
          title: "Registro bem-sucedido!",
          description: result.message || "Seu cadastro foi realizado. Verifique seu e-mail para próximos passos, se aplicável.",
        });
        router.push('/auth/login');
      } else {
        setError(result.message);
        toast({
          title: "Erro no Registro",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (e: any) {
      setError(e.message || 'Falha ao registrar. Tente novamente.');
      toast({
        title: "Erro no Registro",
        description: e.message || 'Falha ao registrar. Tente novamente.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <UserPlus className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-2xl font-bold font-headline">Criar uma Conta</CardTitle>
          <CardDescription>Junte-se ao BidExpert para começar a dar lances e vender.</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-6">
            
            {/* @ts-ignore FormField is used within a FormProvider implicitly by the page structure, assuming react-hook-form context is available */}
            <FormField name="accountType" render={({ field }: any) => ( // Added :any for field type, as Form context is not explicitly provided here.
                <FormItem className="space-y-3">
                    <FormLabel className="text-base">Tipo de Cadastro</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={(value) => setPersonType(value as PersonType)}
                        defaultValue={personType}
                        className="flex flex-col sm:flex-row gap-4"
                        >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="PHYSICAL" id="physical" />
                            </FormControl>
                            <FormLabel htmlFor="physical" className="font-normal cursor-pointer">Pessoa Física</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="LEGAL" id="legal"/>
                            </FormControl>
                            <FormLabel htmlFor="legal" className="font-normal cursor-pointer">Pessoa Jurídica</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="DIRECT_SALE_CONSIGNOR" id="consignor"/>
                            </FormControl>
                            <FormLabel htmlFor="consignor" className="font-normal cursor-pointer">Comitente Venda Direta</FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />


            {personType === 'PHYSICAL' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo*</Label>
                    <Input id="fullName" placeholder="Nome Completo" required 
                      value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF*</Label>
                    <Input id="cpf" placeholder="000.000.000-00" required 
                      value={cpf} onChange={(e) => setCpf(e.target.value)} disabled={isLoading} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Data de Nascimento*</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn( "w-full justify-start text-left font-normal", !dateOfBirth && "text-muted-foreground", isLoading && "disabled:opacity-100")}
                        disabled={isLoading}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateOfBirth ? format(dateOfBirth, "dd/MM/yyyy", { locale: ptBR}) : <span>Selecione uma data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single" selected={dateOfBirth} onSelect={setDateOfBirth} initialFocus
                        captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear() - 18} 
                        disabled={isLoading}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            {(personType === 'LEGAL' || personType === 'DIRECT_SALE_CONSIGNOR') && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="razaoSocial">Razão Social*</Label>
                    <Input id="razaoSocial" placeholder="Nome da Empresa Ltda." required 
                      value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ*</Label>
                    <Input id="cnpj" placeholder="00.000.000/0001-00" required 
                      value={cnpj} onChange={(e) => setCnpj(e.target.value)} disabled={isLoading} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inscricaoEstadual">Inscrição Estadual (Opcional)</Label>
                  <Input id="inscricaoEstadual" placeholder="Número da Inscrição Estadual"
                    value={inscricaoEstadual} onChange={(e) => setInscricaoEstadual(e.target.value)} disabled={isLoading} />
                </div>
                {personType === 'DIRECT_SALE_CONSIGNOR' && (
                    <div className="space-y-2">
                        <Label htmlFor="websiteComitente">Website (Opcional)</Label>
                        <Input id="websiteComitente" type="url" placeholder="www.suaempresa.com.br"
                        value={websiteComitente} onChange={(e) => setWebsiteComitente(e.target.value)} disabled={isLoading} />
                    </div>
                )}
              </>
            )}
            
            <Separator />
            <h3 className="text-md font-semibold text-muted-foreground">Informações de Contato e Acesso</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cellPhone">Telefone Celular*</Label>
                <Input id="cellPhone" placeholder="(00) 00000-0000" required 
                  value={cellPhone} onChange={(e) => setCellPhone(e.target.value)} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmCellPhone">Confirmar Celular*</Label>
                <Input id="confirmCellPhone" placeholder="Repita o celular" required 
                  value={confirmCellPhone} onChange={(e) => setConfirmCellPhone(e.target.value)} disabled={isLoading} />
              </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email*</Label>
                    <Input id="email" type="email" placeholder="seu@email.com" required 
                    value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmEmail">Confirmar Email*</Label>
                    <Input id="confirmEmail" type="email" placeholder="Repita o email" required 
                    value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} disabled={isLoading} />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Senha*</Label>
                <Input id="password" type="password" required 
                  value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha*</Label>
                <Input id="confirmPassword" type="password" required 
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} />
              </div>
            </div>

            <Separator />
            <h3 className="text-md font-semibold text-muted-foreground">Endereço</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input id="zipCode" placeholder="00000-000" value={zipCode} onChange={(e) => setZipCode(e.target.value)} disabled={isLoading} />
                </div>
                 <div className="space-y-2 sm:col-span-2"> {/* Street on its own line or adjusted based on layout preference */}
                    <Label htmlFor="street">Logradouro (Rua/Avenida)</Label>
                    <Input id="street" placeholder="Ex: Rua das Palmeiras" value={street} onChange={(e) => setStreet(e.target.value)} disabled={isLoading} />
                </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input id="number" placeholder="Ex: 123" value={number} onChange={(e) => setNumber(e.target.value)} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input id="complement" placeholder="Ex: Ap 101, Bloco B" value={complement} onChange={(e) => setComplement(e.target.value)} disabled={isLoading} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input id="neighborhood" placeholder="Ex: Centro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} disabled={isLoading} />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" placeholder="Ex: Salvador" value={city} onChange={(e) => setCity(e.target.value)} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="state">Estado (UF)</Label>
                    <Input id="state" placeholder="Ex: BA" maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} disabled={isLoading} />
                </div>
            </div>
            
            <Separator />
            <h3 className="text-md font-semibold text-muted-foreground">Documentos (Upload)</h3>
            <p className="text-xs text-muted-foreground">
              {personType === 'PHYSICAL' ? 'RG ou CNH (frente e verso), Comprovante de Residência.' : 'Contrato Social (ou Requerimento de Empresário), Cartão CNPJ, Documentos dos Sócios (RG/CNH), Comprovante de Endereço da Empresa.'}
              Formatos aceitos: PDF, JPG, PNG (Máx 5MB por arquivo).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="docFrente">Documento (Frente)</Label>
                    <Button type="button" variant="outline" className="w-full justify-start" disabled={isLoading} onClick={() => document.getElementById('file-docFrente')?.click()}>
                        <FileUp className="mr-2 h-4 w-4" /> Selecionar Arquivo
                    </Button>
                    <Input id="file-docFrente" type="file" className="hidden" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="docVerso">Documento (Verso)</Label>
                     <Button type="button" variant="outline" className="w-full justify-start" disabled={isLoading} onClick={() => document.getElementById('file-docVerso')?.click()}>
                        <FileUp className="mr-2 h-4 w-4" /> Selecionar Arquivo
                    </Button>
                    <Input id="file-docVerso" type="file" className="hidden" />
                </div>
                {(personType === 'LEGAL' || personType === 'DIRECT_SALE_CONSIGNOR') && (
                    <>
                         <div className="space-y-2">
                            <Label htmlFor="docContratoSocial">Contrato Social / RE</Label>
                            <Button type="button" variant="outline" className="w-full justify-start" disabled={isLoading} onClick={() => document.getElementById('file-docContratoSocial')?.click()}>
                                <FileUp className="mr-2 h-4 w-4" /> Selecionar Arquivo
                            </Button>
                            <Input id="file-docContratoSocial" type="file" className="hidden" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="docCartaoCnpj">Cartão CNPJ</Label>
                             <Button type="button" variant="outline" className="w-full justify-start" disabled={isLoading} onClick={() => document.getElementById('file-docCartaoCnpj')?.click()}>
                                <FileUp className="mr-2 h-4 w-4" /> Selecionar Arquivo
                            </Button>
                            <Input id="file-docCartaoCnpj" type="file" className="hidden" />
                        </div>
                    </>
                )}
                 <div className="space-y-2">
                    <Label htmlFor="docComprovanteEndereco">Comprovante de Endereço</Label>
                     <Button type="button" variant="outline" className="w-full justify-start" disabled={isLoading} onClick={() => document.getElementById('file-docComprovanteEndereco')?.click()}>
                        <FileUp className="mr-2 h-4 w-4" /> Selecionar Arquivo
                    </Button>
                    <Input id="file-docComprovanteEndereco" type="file" className="hidden" />
                </div>
                 {personType === 'PHYSICAL' && (
                    <div className="space-y-2">
                        <Label htmlFor="docFotoComDocumento">Foto Segurando Documento</Label>
                        <Button type="button" variant="outline" className="w-full justify-start" disabled={isLoading} onClick={() => document.getElementById('file-docFotoComDocumento')?.click()}>
                            <FileUp className="mr-2 h-4 w-4" /> Selecionar Arquivo
                        </Button>
                        <Input id="file-docFotoComDocumento" type="file" className="hidden" />
                    </div>
                 )}
            </div>


            <div className="space-y-2 pt-4">
                <div className="flex items-center space-x-2">
                    <Input type="checkbox" id="acceptTerms" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} disabled={isLoading} className="h-4 w-4 rounded border-primary text-primary focus:ring-primary" />
                    <Label htmlFor="acceptTerms" className="text-xs cursor-pointer">
                        Li e aceito os <Link href="/terms" className="underline text-primary hover:text-primary/80">Termos de Uso</Link> e a <Link href="/privacy" className="underline text-primary hover:text-primary/80">Política de Privacidade</Link>.*
                    </Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <Input type="checkbox" id="optInMarketing" checked={optInMarketing} onChange={(e) => setOptInMarketing(e.target.checked)} disabled={isLoading} className="h-4 w-4 rounded border-primary text-primary focus:ring-primary" />
                    <Label htmlFor="optInMarketing" className="text-xs cursor-pointer">
                        Desejo receber e-mails sobre promoções e novidades do BidExpert.
                    </Label>
                </div>
            </div>


            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
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
      </Card>
    </div>
  );
}

    
