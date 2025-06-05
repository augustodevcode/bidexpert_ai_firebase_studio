
import { getPlatformSettings } from './actions';
import SettingsForm from './settings-form'; // Client component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react'; // Renomeado para evitar conflito

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();

  return (
    <div className="space-y-6">
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <SettingsIcon className="h-7 w-7 mr-3 text-primary" />
            Configurações da Plataforma
          </CardTitle>
          <CardDescription>
            Gerencie as configurações globais do BidExpert.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <SettingsForm initialData={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
