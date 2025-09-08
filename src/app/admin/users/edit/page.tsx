// src/app/admin/users/[userId]/edit/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import UserRoleForm from '../../user-role-form';
import { getUserProfileData, updateUserProfile, updateUserRoles } from '../../actions';
import { getRoles } from '@/app/admin/roles/actions';

import FormPageLayout from '@/components/admin/form-page-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ProfileForm from '@/components/profile/profile-form';

import type { EditableUserProfileData, UserProfileWithPermissions, Role } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { UserCog } from 'lucide-react';


export default function EditUserPage() {
  const params = useParams();
  const userId = params.userId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [userProfile, setUserProfile] = useState<UserProfileWithPermissions | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);
  
  // Usaremos refs para acionar o submit de cada formulário individualmente
  const profileFormRef = useRef<any>(null);
  const roleFormRef = useRef<any>(null);

  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedUser, fetchedRoles] = await Promise.all([
        getUserProfileData(userId),
        getRoles()
      ]);

      if (!fetchedUser) {
        notFound();
        return;
      }
      setUserProfile(fetchedUser);
      setRoles(fetchedRoles);
    } catch (e) {
      console.error("Failed to fetch user data for edit page", e);
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Handler para salvar ambos os formulários
  const handleSaveAll = async () => {
    setIsSubmitting(true);

    const profilePromise = profileFormRef.current?.requestSubmit();
    const rolePromise = roleFormRef.current?.requestSubmit();

    try {
        // As ações internas dos formulários já lidam com o toast
        await Promise.all([profilePromise, rolePromise]);
        toast({title: "Sucesso!", description: "Dados do usuário e perfis salvos."});
        await fetchUserData(); // Re-fetch all data
        setIsViewMode(true);
    } catch (error) {
        console.error("Error saving user data:", error);
        toast({title: "Erro", description: "Ocorreu um erro ao salvar um dos formulários.", variant: "destructive"});
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleUpdateProfile = async (data: EditableUserProfileData) => {
    return updateUserProfile(userId, data);
  };
  
  const handleUpdateRoles = async (uid: string, roleIds: string[]) => {
      return updateUserRoles(uid, roleIds);
  };

  return (
    <FormPageLayout
      formTitle={isViewMode ? "Visualizar Usuário" : "Editar Usuário"}
      formDescription={userProfile?.fullName || userProfile?.email || 'Carregando...'}
      icon={UserCog}
      isViewMode={isViewMode}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      onEnterEditMode={() => setIsViewMode(false)}
      onCancel={() => setIsViewMode(true)}
      onSave={handleSaveAll}
      // O delete pode ser adicionado no futuro
    >
      {userProfile && (
        <fieldset disabled={isViewMode || isSubmitting} className="group/fieldset space-y-6">
          <div data-ai-id="admin-user-profile-form-container">
            <ProfileForm
              ref={profileFormRef}
              initialData={userProfile}
              onSubmitAction={handleUpdateProfile}
              context="admin"
            />
          </div>

          <Separator />
          
          <div data-ai-id="admin-user-role-form-container">
            <UserRoleForm
              ref={roleFormRef}
              user={userProfile}
              roles={roles}
              onSubmitAction={handleUpdateRoles}
            />
          </div>
        </fieldset>
      )}
    </FormPageLayout>
  );
}
