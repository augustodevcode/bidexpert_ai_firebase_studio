
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, type FormEvent } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase'; 
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; 
import { useToast } from '@/hooks/use-toast';
import type { UserProfileData } from '@/types'; 
import { getRoleByName } from '@/app/admin/roles/actions'; // Importar para buscar o Role ID

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [cellPhone, setCellPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    if (!dateOfBirth) {
      setError("Por favor, selecione sua data de nascimento.");
      toast({ title: "Erro", description: "Por favor, selecione sua data de nascimento.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Atualizar o perfil do Firebase Auth com o nome completo
      await updateProfile(user, { displayName: fullName });

      // Buscar o ID do perfil 'USER' padrão
      let defaultRoleId: string | undefined = undefined;
      let defaultRoleName: string | undefined = undefined;
      try {
        const userRole = await getRoleByName('USER'); // Busca o perfil "USER"
        if (userRole) {
          defaultRoleId = userRole.id;
          defaultRoleName = userRole.name;
        } else {
          console.warn("Default 'USER' role not found in Firestore. New user will not have a role assigned.");
        }
      } catch (roleError) {
        console.error("Error fetching default 'USER' role:", roleError);
      }

      const userProfileToSave: Partial<UserProfileData> = {
        uid: user.uid,
        fullName,
        cpf,
        email: user.email, 
        cellPhone,
        dateOfBirth, 
        roleId: defaultRoleId, 
        roleName: defaultRoleName,
        createdAt: serverTimestamp() as any, 
        status: 'ATIVO', // Status inicial
        optInMarketing: true, // Exemplo, pode vir de um checkbox
      };
      await setDoc(doc(db, "users", user.uid), userProfileToSave);
      
      toast({
        title: "Registro bem-sucedido!",
        description: "Sua conta foi criada. Você pode fazer login agora.",
      });
      router.push('/auth/login');
    } catch (e: any) {
      let errorMessage = 'Falha ao registrar. Tente novamente.';
      if (e.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está em uso. Tente outro.';
      } else if (e.code === 'auth/weak-password') {
        errorMessage = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
      } else if (e.message) {
        errorMessage = e.message;
      }
      setError(errorMessage);
      toast({
        title: "Erro no Registro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-20rem)] py-12">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <UserPlus className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-2xl font-bold font-headline">Criar uma Conta</CardTitle>
          <CardDescription>Junte-se ao BidExpert para começar a dar lances e vender.</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input id="fullName" placeholder="Nome Completo" required 
                  value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" placeholder="000.000.000-00" required 
                  value={cpf} onChange={(e) => setCpf(e.target.value)} disabled={isLoading} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" required 
                  value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cellPhone">Telefone Celular</Label>
                <Input id="cellPhone" placeholder="(00) 00000-0000" required 
                  value={cellPhone} onChange={(e) => setCellPhone(e.target.value)} disabled={isLoading} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateOfBirth && "text-muted-foreground",
                      isLoading && "disabled:opacity-100"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateOfBirth ? format(dateOfBirth, "dd/MM/yyyy", { locale: ptBR}) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateOfBirth}
                    onSelect={setDateOfBirth}
                    initialFocus
                    captionLayout="dropdown-buttons"
                    fromYear={1900}
                    toYear={new Date().getFullYear() - 18} 
                    disabled={isLoading}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" required 
                  value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input id="confirmPassword" type="password" required 
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} />
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
