// src/app/admin/qa/actions.ts
'use server';

import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

/**
 * Executes the end-to-end test for the seller creation flow.
 * @returns {Promise<{ success: boolean; output: string; error?: string }>} 
 *          An object containing the success status and the output/error from the test execution.
 */
export async function runSellerEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    console.log('[QA Action] Running Seller E2E Test...');
    try {
        // The command needs to point to the correct test runner and file
        const command = `dotenv -e .env -- tsx ./tests/seller.test.ts`;
        const { stdout, stderr } = await execPromise(command);

        if (stderr) {
            // node:test often outputs to stderr even on success, so we check for failure markers.
            if (stderr.includes('# fail') || stderr.toLowerCase().includes('error')) {
                 console.error('[QA Action] Test execution has stderr failures:', stderr);
                 return { success: false, output: stdout, error: stderr };
            }
             console.log('[QA Action] Test execution has stderr but no failures:', stderr);
        }
        
        console.log('[QA Action] Test executed successfully. stdout:', stdout);
        return { success: true, output: stdout + (stderr ? `\n--- STDERR (No Failures) ---\n${stderr}` : '') };

    } catch (error: any) {
        console.error('[QA Action] Error executing test script:', error);
        // The error object often contains stdout and stderr from the failed command
        const output = error.stdout || '';
        const errorMessage = error.stderr || error.message;
        return { success: false, output: output, error: errorMessage };
    }
}
