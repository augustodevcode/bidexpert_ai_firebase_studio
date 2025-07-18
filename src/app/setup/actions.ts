// src/app/setup/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';

/**
 * Checks if the setup has been marked as complete in the database.
 * This prevents the setup wizard from running on every startup.
 * @returns {Promise<boolean>} True if setup is complete, false otherwise.
 */
export async function getSetupStatus(): Promise<boolean> {
  try {
    const db = getDatabaseAdapter();
    // A specific method like this would be cleaner, but we can do it generically.
    // @ts-ignore
    if(db.getSystemInfo) {
        // @ts-ignore
        const systemInfo = await db.getSystemInfo('global');
        return systemInfo?.isSetupComplete === true;
    }
    // Generic fallback
    const settings = await db.getPlatformSettings(); // Using platform settings as a proxy
    // @ts-ignore
    return settings?.isSetupComplete === true;

  } catch (error) {
    console.error("Error checking setup status:", error);
    return false;
  }
}

/**
 * Resets the setup status flag in the database.
 * This is a development utility to allow re-running the setup wizard.
 * @returns {Promise<{success: boolean}>}
 */
export async function resetSetupStatus(): Promise<{ success: boolean }> {
  try {
    const db = getDatabaseAdapter();
    // @ts-ignore
    if (db.updateSystemInfo) {
        // @ts-ignore
        await db.updateSystemInfo('global', { isSetupComplete: false });
    } else {
        // Fallback using platform settings
        await db.updatePlatformSettings({ isSetupComplete: false });
    }
    return { success: true };
  } catch (error) {
    console.error("Error resetting setup status:", error);
    return { success: false };
  }
}