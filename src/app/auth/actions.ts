'use server';
import { getDatabaseAdapter } from '@/lib/database';
import type { SqlAuthResult, UserProfileWithPermissions } from '@/types';
// Import a user action that is now guaranteed to use sample data
import { getUserByEmail } from '@/app/admin/users/actions';

export async function authenticateUserSql(
  email: string,
  passwordAttempt: string
): Promise<SqlAuthResult> {
  // This function will now use the mocked user action instead of the database adapter,
  // making it consistent with the rest of the user/role logic.
  try {
    console.log(`[authenticateUserSql] Attempting to authenticate ${email} via user actions (sample-data).`);
    const userProfile = await getUserByEmail(email.toLowerCase());

    if (!userProfile) {
      return { success: false, message: 'Usuário não encontrado.' };
    }
    
    console.log(`[authenticateUserSql] Profile found for ${email}. Checking password.`);
    // The password from sample data is in plain text for this prototype.
    if (userProfile.password === passwordAttempt) {
      const { password, ...userToReturn } = userProfile;
      console.log(`[authenticateUserSql] Password match for ${email}. Login successful.`);
      return {
        success: true,
        message: 'Login bem-sucedido (SampleData)!',
        user: userToReturn as UserProfileWithPermissions, 
      };
    } else {
      console.warn(`[authenticateUserSql] Password mismatch for ${email}.`);
      return { success: false, message: 'Senha incorreta.' };
    }
  } catch (error: any) {
    console.error('[authenticateUserSql] Error:', error);
    return { success: false, message: error.message || 'Erro durante a autenticação.' };
  }
}
