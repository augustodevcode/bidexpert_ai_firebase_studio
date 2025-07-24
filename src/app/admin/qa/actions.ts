// src/app/admin/qa/actions.ts
'use server';

import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

// Helper function to run a test script and handle output/errors
async function runTestScript(command: string): Promise<{ success: boolean; output: string; error?: string }> {
    console.log(`[QA Action] Running command: ${command}`);
    try {
        const { stdout, stderr } = await execPromise(command);

        if (stderr) {
            // node:test often outputs to stderr even on success, so we check for failure markers.
            if (stderr.includes('# fail') || stderr.toLowerCase().includes('error')) {
                 console.error(`[QA Action] Test execution has stderr failures for command "${command}":`, stderr);
                 return { success: false, output: stdout, error: stderr };
            }
             console.log(`[QA Action] Test execution has stderr but no failures for command "${command}":`, stderr);
        }
        
        console.log(`[QA Action] Test executed successfully for command "${command}". stdout:`, stdout);
        return { success: true, output: stdout + (stderr ? `\n--- STDERR (No Failures) ---\n${stderr}` : '') };

    } catch (error: any) {
        console.error(`[QA Action] Error executing test script "${command}":`, error);
        const output = error.stdout || '';
        const errorMessage = error.stderr || error.message;
        return { success: false, output: output, error: errorMessage };
    }
}


/**
 * Executes the end-to-end test for the seller creation flow.
 * @returns {Promise<{ success: boolean; output: string; error?: string }>} 
 *          An object containing the success status and the output/error from the test execution.
 */
export async function runSellerEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `dotenv -e .env -- tsx ./tests/seller.test.ts`;
    return runTestScript(command);
}

/**
 * Executes the end-to-end test for the auctioneer creation flow.
 * @returns {Promise<{ success: boolean; output: string; error?: string }>} 
 *          An object containing the success status and the output/error from the test execution.
 */
export async function runAuctioneerEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `dotenv -e .env -- tsx ./tests/auctioneer.test.ts`;
    return runTestScript(command);
}

/**
 * Executes the end-to-end test for the category creation flow.
 * @returns {Promise<{ success: boolean; output: string; error?: string }>} 
 *          An object containing the success status and the output/error from the test execution.
 */
export async function runCategoryEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `dotenv -e .env -- tsx ./tests/category.test.ts`;
    return runTestScript(command);
}
