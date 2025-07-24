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
             console.log(`[QA Action] Test executed with stderr but no failures for command "${command}":`, stderr);
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


export async function runSellerEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `dotenv -e .env -- tsx ./tests/seller.test.ts`;
    return runTestScript(command);
}

export async function runAuctioneerEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `dotenv -e .env -- tsx ./tests/auctioneer.test.ts`;
    return runTestScript(command);
}

export async function runCategoryEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `dotenv -e .env -- tsx ./tests/category.test.ts`;
    return runTestScript(command);
}

export async function runSubcategoryEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `dotenv -e .env -- tsx ./tests/subcategory.test.ts`;
    return runTestScript(command);
}

export async function runRoleEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `dotenv -e .env -- tsx ./tests/role.test.ts`;
    return runTestScript(command);
}

export async function runCourtEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `dotenv -e .env -- tsx ./tests/court.test.ts`;
    return runTestScript(command);
}

export async function runJudicialDistrictEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `dotenv -e .env -- tsx ./tests/judicial-district.test.ts`;
    return runTestScript(command);
}

export async function runJudicialBranchEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `dotenv -e .env -- tsx ./tests/judicial-branch.test.ts`;
    return runTestScript(command);
}

export async function runJudicialProcessEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `dotenv -e .env -- tsx ./tests/judicial-process.test.ts`;
    return runTestScript(command);
}

export async function runBemEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `dotenv -e .env -- tsx ./tests/bem.test.ts`;
    return runTestScript(command);
}

export async function runAuctionEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `dotenv -e .env -- tsx ./tests/auction.test.ts`;
    return runTestScript(command);
}

export async function runLotEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `dotenv -e .env -- tsx ./tests/lot.test.ts`;
    return runTestScript(command);
}
