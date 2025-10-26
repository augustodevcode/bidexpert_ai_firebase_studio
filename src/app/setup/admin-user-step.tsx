// src/components/setup/admin-user-step.tsx
'use client';

import { useState } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserCog, Eye, EyeOff } from 'lucide-react';
import { createAdminUser } from '@/app/setup/actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import type { UserProfileWithPermissions } from '@/types';

interface AdminUserStepProps {
  onNext: () => void;
  onPrev: () => void;
}

export default function AdminUserStep({ onNext, onPrev }: AdminUserStepProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const { toast } = useToast();
    const { loginUser } = useAuth(); // Usar o contexto para atualizar o estado de login

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);
        const result = await createAdminUser(formData);

        if (result.success && result.user) {
            toast({
                title: "Administrador Criado!",
                description: "O usuário principal da plataforma foi configurado e a sessão iniciada.",
            });
            // Atualiza o contexto de autenticação com o novo usuário
            loginUser(result.user, result.user.tenants?.[0]?.tenant?.id || '1');
            onNext();
        } else {
            toast({
                title: "Erro ao Criar Administrador",
                description: result.message,
                variant: "destructive",
            });
        }
        setIsLoading(false);
    };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle>Criar Conta de Administrador</CardTitle>
        <CardDescription>
          Este será o usuário principal para gerenciar toda a plataforma. Guarde bem estas informações.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
         <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input id="fullName" name="fullName" defaultValue="Administrador" required disabled={isLoading} data-ai-id="setup-admin-fullname-input" />
        </div>
         <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue="admin@bidexpert.com.br" required disabled={isLoading} data-ai-id="setup-admin-email-input" />
        </div>
         <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
                <Input id="password" name="password" type={passwordVisible ? 'text' : 'password'} defaultValue="Admin@123" required disabled={isLoading} data-ai-id="setup-admin-password-input" />
                <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => setPasswordVisible(!passwordVisible)}>
                    {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onPrev} disabled={isLoading} data-ai-id="setup-admin-back-button">Voltar</Button>
        <Button type="submit" disabled={isLoading} data-ai-id="setup-admin-create-button">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            {isLoading ? "Criando..." : "Salvar e Avançar"}
        </Button>
      </CardFooter>
    </form>
  );
}
