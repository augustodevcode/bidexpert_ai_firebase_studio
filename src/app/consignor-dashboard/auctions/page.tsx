// src/app/consignor-dashboard/auctions/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuctionsForConsignorAction } from './actions';
import type { Auction } from '@/types';
import { PlusCircle, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createConsignorAuctionColumns } from './columns';
import { useAuth } from '@/contexts/auth-context';
import { getAuctionStatusText } from '@/lib/sample-data-helpers';

/**
 * ConsignorAuctionsPage displays a list of auctions belonging to the currently
 * logged-in consignor. It fetches data using a server action and presents it
 * in a filterable, sortable data table.
 */
export default function ConsignorAuctionsPage() {
  const { userProfileWithPermissions, loading: authLoading } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Fetches the auctions for a given seller ID.
   * @param {string} sellerId The ID of the seller/consignor.
   */
  const fetchAuctions = useCallback(async (sellerId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedAuctions = await getAuctionsForConsignorAction(sellerId);
      setAuctions(fetchedAuctions);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar seus leilões.";
      console.error("Error fetching consignor's auctions:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Effect to trigger data fetching when the user profile is available.
  useEffect(() => {
    const sellerId = userProfileWithPermissions?.sellerId;
    if (!authLoading && sellerId) {
      fetchAuctions(sellerId);
    } else if (!authLoading) {
      setError("Perfil de comitente não encontrado ou não vinculado à sua conta.");
      setIsLoading(false);
    }
  }, [userProfileWithPermissions, authLoading, fetchAuctions]);

  // Memoize columns to prevent re-creation on every render.
  const columns = useMemo(() => createConsignorAuctionColumns(), []);
  
  // Memoize options for faceted filtering.
  const statusOptions = useMemo(() => 
    [...new Set(auctions.map(a => a.status))]
      .map(status => ({ value: status, label: getAuctionStatusText(status) })),
  [auctions]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'status', title: 'Status', options: statusOptions },
  ], [statusOptions]);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Briefcase className="h-6 w-6 mr-2 text-primary" />
              Meus Leilões
            </CardTitle>
            <CardDescription>
              Visualize e gerencie os leilões que você criou.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/auctions/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Leilão
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={auctions}
            isLoading={isLoading || authLoading}
            error={error}
            searchColumnId="title"
            searchPlaceholder="Buscar por título..."
            facetedFilterColumns={facetedFilterColumns}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```
  </change>
  <change>
    <file>/src/app/auth/login/actions.ts</file>
    <content><![CDATA[// src/app/auth/login/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import bcrypt from 'bcrypt';
import { createSession } from '@/lib/session';
import type { UserProfileData, UserProfileWithPermissions } from '@/types';

/**
 * Realiza o login de um usuário com base no email e senha.
 * Verifica as credenciais, e se forem válidas, cria uma sessão criptografada em um cookie.
 * @param formData - O FormData do formulário de login, contendo email e senha.
 * @returns Um objeto indicando o sucesso ou falha da operação.
 */
export async function login(formData: FormData): Promise<{ success: boolean; message: string }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, message: 'Email e senha são obrigatórios.' };
  }

  try {
    const db = await getDatabaseAdapter();
    const usersWithRoles = await db.getUsersWithRoles();
    const user = usersWithRoles.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user || !user.password) {
      console.log(`[Login Action] User not found or password not set for email: ${email}`);
      return { success: false, message: 'Credenciais inválidas.' };
    }
    
    const activeDbSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA';
    const isSampleData = activeDbSystem === 'SAMPLE_DATA';
    
    console.log(`[Login Action] Authenticating for user ${email}. System: ${activeDbSystem}. Is Sample Data: ${isSampleData}`);
    
    const isPasswordValid = isSampleData 
        ? (password === user.password) 
        : await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`[Login Action] Invalid password for user: ${email}`);
      return { success: false, message: 'Credenciais inválidas.' };
    }
    
    const userProfileWithPerms: UserProfileWithPermissions = user;

    await createSession(userProfileWithPerms);
    
    console.log(`[Login Action] Session created successfully for ${email}`);
    return { success: true, message: 'Login bem-sucedido!' };

  } catch (error) {
    console.error('[Login Action] Error:', error);
    return { success: false, message: 'Ocorreu um erro interno durante o login.' };
  }
}
```
  </change>
  <change>
    <file>/src/lib/database.ts</file>
    <content><![CDATA[// src/lib/database.ts
import 'server-only';
import { FirestoreAdapter } from './database/firestore.adapter';
import { MySqlAdapter } from './database/mysql.adapter';
import { PostgresAdapter } from './database/postgres.adapter';
import { SampleDataAdapter } from './database/sample-data.adapter';
import type { DatabaseAdapter } from '@/types';

/**
 * Dynamically determines which database adapter to use based on environment variables.
 * This function should be called within each Server Action that needs to interact with the database.
 * @returns {Promise<DatabaseAdapter>} A promise that resolves to an instance of the correct database adapter.
 */
export const getDatabaseAdapter = async (): Promise<DatabaseAdapter> => {
  const availableSystems = ['FIRESTORE', 'MYSQL', 'POSTGRES', 'SAMPLE_DATA'];
  
  // A variável de ambiente é a fonte única da verdade.
  const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA';

  if (!availableSystems.includes(activeSystem)) {
    console.error(`Invalid database system selected: ${activeSystem}. Falling back to SAMPLE_DATA.`);
    return new SampleDataAdapter();
  }

  // console.log(`[Database] Using adapter for: ${activeSystem}`);

  switch (activeSystem) {
    case 'FIRESTORE':
      return new FirestoreAdapter();
    case 'MYSQL':
      return new MySqlAdapter();
    case 'POSTGRES':
      return new PostgresAdapter();
    case 'SAMPLE_DATA':
    default:
      return new SampleDataAdapter();
  }
};
```
  </change>
  <change>
    <file>/src/lib/database/index.ts</file>
    <content><![CDATA[// src/lib/database/index.ts
import 'server-only';
import { FirestoreAdapter } from './firestore.adapter';
import { MySqlAdapter } from './mysql.adapter';
import { PostgresAdapter } from './postgres.adapter';
import { SampleDataAdapter } from './sample-data.adapter';
import type { DatabaseAdapter } from '@/types';

/**
 * Dynamically determines which database adapter to use based on environment variables.
 * This function should be called within each Server Action that needs to interact with the database.
 * @returns {Promise<DatabaseAdapter>} A promise that resolves to an instance of the correct database adapter.
 */
export const getDatabaseAdapter = async (): Promise<DatabaseAdapter> => {
  const availableSystems = ['FIRESTORE', 'MYSQL', 'POSTGRES', 'SAMPLE_DATA'];
  
  // A variável de ambiente é a fonte única da verdade.
  const activeSystem = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA';

  if (!availableSystems.includes(activeSystem)) {
    console.error(`Invalid database system selected: ${activeSystem}. Falling back to SAMPLE_DATA.`);
    return new SampleDataAdapter();
  }

  // console.log(`[Database] Using adapter for: ${activeSystem}`);

  switch (activeSystem) {
    case 'FIRESTORE':
      return new FirestoreAdapter();
    case 'MYSQL':
      return new MySqlAdapter();
    case 'POSTGRES':
      return new PostgresAdapter();
    case 'SAMPLE_DATA':
    default:
      return new SampleDataAdapter();
  }
};
```
  </change>
  <change>
    <file>/src/components/layout/dev-db-indicator.tsx</file>
    <content><![CDATA[// src/components/layout/dev-db-indicator.tsx
'use client';

import { useEffect, useState } from 'react';

export default function DevDbIndicator() {
  const [dbSystem, setDbSystem] = useState('');

  useEffect(() => {
    // We read the system directly from the public environment variable.
    const dbFromEnv = process.env.NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM || 'SAMPLE_DATA';
    setDbSystem(dbFromEnv);
  }, []);

  if (process.env.NODE_ENV !== 'development' || !dbSystem) {
    return null;
  }

  return (
    <p className="text-xs text-muted-foreground mt-2">
      Active DB System: <span className="font-semibold text-primary">{dbSystem.toUpperCase()}</span> (Dev Only)
    </p>
  );
}
```
  </change>
  <change>
    <file>/.env</file>
    <content><![CDATA[
# Security
SESSION_SECRET=a_secure_random_string_with_at_least_32_characters_long

# Database Configuration (SAMPLE_DATA, FIRESTORE, MYSQL, POSTGRES)
# For development, we'll default to SAMPLE_DATA.
# To use a real database, change this variable and provide the corresponding connection string/credentials below.
NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM=SAMPLE_DATA

# Firestore Credentials (if using FIRESTORE)
# The path should be relative to the project root.
GOOGLE_APPLICATION_CREDENTIALS=./bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json

# PostgreSQL Connection String (if using POSTGRES)
POSTGRES_DATABASE_URL="postgresql://user:password@host:port/database"

# MySQL Connection String (if using MYSQL)
MYSQL_DATABASE_URL="mysql://user:password@host:port/database"

# Firebase Client SDK Configuration (for client-side interactions, if any)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Datajud API Key (for CNJ import)
DATAJUD_API_KEY=
