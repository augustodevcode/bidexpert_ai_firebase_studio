
// src/app/admin/users/new/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';

export default function NewUserPage() {
  // A criação de usuários pelo admin (com definição de senha, etc.)
  // é mais complexa e geralmente envolve o Admin SDK ou funções customizadas.
  // Por agora, esta página será um placeholder.
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            Novo Usuário
        </CardTitle>
        <CardDescription>
          A funcionalidade de criação de novos usuários pelo painel administrativo está em desenvolvimento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Por enquanto, novos usuários devem se registrar através da página de registro pública.
          Futuramente, administradores poderão criar contas de usuários diretamente por aqui.
        </p>
      </CardContent>
    </Card>
  );
}
