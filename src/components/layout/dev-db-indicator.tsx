
'use client';

import { useEffect, useState } from 'react';
import { Badge } from '../ui/badge';
import { useAuth } from '@/contexts/auth-context';

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const popped = parts.pop();
    if (popped) {
        return popped.split(';').shift();
    }
  }
  return undefined;
}


export default function DevDbIndicator() {
  const [dbSystem, setDbSystem] = useState('');
  const [projectId, setProjectId] = useState('');
  // useAuth pode ser chamado, mas o acesso ao seu valor deve ser condicional
  const authContext = useAuth(); 

  useEffect(() => {
    const dbFromCookie = getCookie('dev-config-db');
    const dbFromEnv = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA';
    setDbSystem(dbFromCookie || dbFromEnv);
    setProjectId(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'N/A');
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Opcionalmente, pode-se obter o email apenas se o contexto não estiver carregando
  const userEmail = !authContext.loading ? authContext.userProfileWithPermissions?.email : 'carregando...';

  return (
    <div className="mt-4 p-2 bg-muted/50 rounded-md text-xs text-muted-foreground space-y-1 text-center border">
        <p className="font-semibold text-foreground">Dev Info</p>
        <p>
            <Badge variant="secondary" className="mr-1.5">DB System</Badge>
            <span className="font-semibold text-primary">{dbSystem.toUpperCase()}</span>
        </p>
         <p>
            <Badge variant="secondary" className="mr-1.5">Project</Badge>
            <span className="font-semibold text-primary">{projectId}</span>
        </p>
        <p>
            <Badge variant="secondary" className="mr-1.5">User</Badge>
            {/* O email será exibido se o contexto estiver disponível, mas não quebrará se não estiver */}
            <span className="font-semibold text-primary truncate">{userEmail || 'N/A'}</span>
        </p>
    </div>
  );
}
