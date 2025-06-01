
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mail, MapPin, CalendarDays, Edit3, User, Phone, Briefcase, Landmark, Users, ShieldCheck, CreditCard, FileText } from 'lucide-react';
import Link from 'next/link';

// Placeholder user data - more aligned with User entity from spec
const user = {
  name: 'Alex Johnson Completo',
  email: 'alex.johnson@example.com',
  avatarUrl: 'https://placehold.co/128x128.png',
  dataAiHint: 'profile photo',
  cpf: '123.456.789-00',
  dateOfBirth: new Date('1990-05-15'),
  cellPhone: '(11) 98765-4321',
  homePhone: '(11) 3333-4444',
  gender: 'Masculino',
  profession: 'Engenheiro de Software',
  nationality: 'Brasileiro',
  maritalStatus: 'Casado',
  memberSince: new Date('2022-08-15'),
  zipCode: '01000-000',
  street: 'Rua Exemplo',
  number: '123',
  complement: 'Apto 4B',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  status: 'HABILITATED', // From user states in spec
  activeBids: 5,
  auctionsWon: 12,
  itemsSold: 3,
  optInMarketing: true,
};

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="relative pb-0">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary to-accent rounded-t-lg" />
          <div className="relative flex flex-col items-center pt-8 sm:flex-row sm:items-end sm:space-x-6">
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.dataAiHint}/>
              <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left mt-4 sm:mt-0 pb-2">
              <CardTitle className="text-3xl font-bold font-headline">{user.name}</CardTitle>
              <CardDescription className="text-muted-foreground flex items-center justify-center sm:justify-start">
                <Mail className="h-4 w-4 mr-2" /> {user.email}
              </CardDescription>
               <CardDescription className="text-muted-foreground text-xs mt-1">
                Status da Conta: <span className="font-semibold text-green-600">{user.status}</span>
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="absolute top-4 right-4 sm:static sm:ml-auto">
              <Edit3 className="h-4 w-4 mr-2" /> Editar Perfil
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          
          <section>
            <h3 className="text-xl font-semibold mb-3 text-primary flex items-center">
              <User className="h-5 w-5 mr-2" /> Informações Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div><span className="font-medium text-foreground">CPF:</span> <span className="text-muted-foreground">{user.cpf}</span></div>
              <div><span className="font-medium text-foreground">Data de Nascimento:</span> <span className="text-muted-foreground">{user.dateOfBirth.toLocaleDateString('pt-BR')}</span></div>
              <div><span className="font-medium text-foreground">Celular:</span> <span className="text-muted-foreground">{user.cellPhone}</span></div>
              <div><span className="font-medium text-foreground">Telefone Residencial:</span> <span className="text-muted-foreground">{user.homePhone}</span></div>
              <div><span className="font-medium text-foreground">Gênero:</span> <span className="text-muted-foreground">{user.gender}</span></div>
              <div><span className="font-medium text-foreground">Profissão:</span> <span className="text-muted-foreground">{user.profession}</span></div>
              <div><span className="font-medium text-foreground">Nacionalidade:</span> <span className="text-muted-foreground">{user.nationality}</span></div>
              <div><span className="font-medium text-foreground">Estado Civil:</span> <span className="text-muted-foreground">{user.maritalStatus}</span></div>
              <div><span className="font-medium text-foreground">Membro Desde:</span> <span className="text-muted-foreground">{user.memberSince.toLocaleDateString('pt-BR')}</span></div>
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="text-xl font-semibold mb-3 text-primary flex items-center">
              <MapPin className="h-5 w-5 mr-2" /> Endereço
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div><span className="font-medium text-foreground">CEP:</span> <span className="text-muted-foreground">{user.zipCode}</span></div>
              <div><span className="font-medium text-foreground">Logradouro:</span> <span className="text-muted-foreground">{user.street}, {user.number}</span></div>
              <div><span className="font-medium text-foreground">Complemento:</span> <span className="text-muted-foreground">{user.complement}</span></div>
              <div><span className="font-medium text-foreground">Bairro:</span> <span className="text-muted-foreground">{user.neighborhood}</span></div>
              <div><span className="font-medium text-foreground">Cidade:</span> <span className="text-muted-foreground">{user.city}</span></div>
              <div><span className="font-medium text-foreground">Estado:</span> <span className="text-muted-foreground">{user.state}</span></div>
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="text-xl font-semibold mb-4 text-primary flex items-center">
              <Briefcase className="h-5 w-5 mr-2" /> Atividade de Leilões
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <Card className="p-4 bg-secondary/50">
                <p className="text-3xl font-bold text-primary">{user.activeBids}</p>
                <p className="text-xs text-muted-foreground mt-1">Lances Ativos</p>
              </Card>
              <Card className="p-4 bg-secondary/50">
                <p className="text-3xl font-bold text-primary">{user.auctionsWon}</p>
                <p className="text-xs text-muted-foreground mt-1">Leilões Ganhos</p>
              </Card>
              <Card className="p-4 bg-secondary/50">
                <p className="text-3xl font-bold text-primary">{user.itemsSold}</p>
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
                <Button variant="outline" asChild className="justify-start text-left h-auto py-3">
                    <Link href="/dashboard/financial">
                        <CreditCard className="h-5 w-5 mr-3 text-muted-foreground" />
                         <div>
                            <span className="font-medium">Informações Financeiras</span>
                            <p className="text-xs text-muted-foreground">Gerencie seus pagamentos e recebimentos.</p>
                        </div>
                    </Link>
                </Button>
                 <Button variant="outline" asChild className="justify-start text-left h-auto py-3">
                    <Link href="/dashboard/preferences">
                        <Users className="h-5 w-5 mr-3 text-muted-foreground" />
                         <div>
                            <span className="font-medium">Preferências e Notificações</span>
                            <p className="text-xs text-muted-foreground">Ajuste como você recebe informações.</p>
                        </div>
                    </Link>
                </Button>
            </div>
          </section>

        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Preferências de Marketing: {user.optInMarketing ? "Você optou por receber comunicações de marketing." : "Você optou por não receber comunicações de marketing."}
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

    