
// src/app/profile/edit/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, UserCog, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { getUserProfileData as getUserProfileDataAction } from '@/app/admin/users/actions';
import { updateUserProfile } from './actions';
import ProfileForm from '@/components/profile/profile-form'; // Usando o novo formulário
import type { EditableUserProfileData, UserProfileData } from '@/types';
import { Button } from '@/components/ui/button';

export default function EditProfilePage() {
  const { userProfileWithPermissions, loading: authLoading, refetchUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchProfileData = useCallback(async (uid: string) => {
    setIsFetchingData(true);
    setFetchError(null);
    try {
      const data = await getUserProfileDataAction(uid);
      if (data) {
        setProfileData(data);
      } else {
        setFetchError("Seu perfil não pôde ser encontrado no banco de dados.");
      }
    } catch (e: any) {
      console.error("Error fetching user profile for edit:", e);
      setFetchError("Erro ao buscar dados do perfil para edição.");
    } finally {
      setIsFetchingData(false);
    }
  }, []);

  useEffect(() => {
    const userId = userProfileWithPermissions?.id;
    if (userId) {
      fetchProfileData(userId);
    } else if (!authLoading) {
      toast({ title: "Acesso Negado", description: "Você precisa estar logado.", variant: "destructive" });
      router.push('/auth/login?redirect=/profile/edit');
    }
  }, [userProfileWithPermissions, authLoading, fetchProfileData, router, toast]);

  const handleUpdate = async (data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> => {
    const userId = userProfileWithPermissions?.id;
    if (!userId) {
      return { success: false, message: 'Usuário não autenticado.' };
    }
    const result = await updateUserProfile(userId, data);
    if (result.success) {
      await refetchUser(); // Refetch user data in context to reflect changes everywhere
    }
    return result;
  };

  if (authLoading || isFetchingData) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Carregando seus dados...</p>
      </div>
    );
  }

  if (fetchError || !profileData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive">{fetchError || "Perfil não encontrado."}</h2>
        <Button asChild className="mt-4"><Link href="/profile">Voltar ao Perfil</Link></Button>
      </div>
    );
  }

  return (
    <ProfileForm
      initialData={profileData}
      onSubmitAction={handleUpdate}
      context="user"
    />
  );
}
