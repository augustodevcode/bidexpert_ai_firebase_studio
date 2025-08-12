// src/app/admin/qa/actions.ts
/**
 * @fileoverview Server Actions for the Quality Assurance (QA) panel.
 * These actions execute predefined test scripts using `node:child_process`
 * and return the stdout and stderr for display in the UI.
 */
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

export async function runBiddingEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/bidding-e2e.test.ts`;
    return runTestScript(command);
}

export async function runHabilitationEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/habilitation.test.ts`;
    return runTestScript(command);
}

export async function runMenuContentTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/menu-content.test.ts`;
    return runTestScript(command);
}

export async function runModalitiesMenuTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/modalities-menu.test.ts`;
    return runTestScript(command);
}

export async function runUserEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/user.test.ts`;
    return runTestScript(command);
}

export async function runSellerEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/seller.test.ts`;
    return runTestScript(command);
}

export async function runAuctioneerEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/auctioneer.test.ts`;
    return runTestScript(command);
}

export async function runCategoryEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/category.test.ts`;
    return runTestScript(command);
}

export async function runSubcategoryEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/subcategory.test.ts`;
    return runTestScript(command);
}

export async function runRoleEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/role.test.ts`;
    return runTestScript(command);
}

export async function runStateEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/state.test.ts`;
    return runTestScript(command);
}

export async function runCityEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/city.test.ts`;
    return runTestScript(command);
}

export async function runCourtEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/court.test.ts`;
    return runTestScript(command);
}

export async function runJudicialDistrictEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/judicial-district.test.ts`;
    return runTestScript(command);
}

export async function runJudicialBranchEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/judicial-branch.test.ts`;
    return runTestScript(command);
}

export async function runJudicialProcessEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/judicial-process.test.ts`;
    return runTestScript(command);
}

export async function runBemEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/bem.test.ts`;
    return runTestScript(command);
}

export async function runLotEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/lot.test.ts`;
    return runTestScript(command);
}

export async function runMediaLibraryEndToEndTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/media.test.ts`;
    return runTestScript(command);
}

export async function runPlatformSettingsTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/platform-settings.test.ts`;
    return runTestScript(command);
}

// Renamed UI tests to reflect their new service-layer focus
export async function runAuctionDataValidationTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/auction-data.test.ts`;
    return runTestScript(command);
}

export async function runSearchAndFilterTest(): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `NODE_ENV=test tsx --env-file=.env tests/search-and-filter.test.ts`;
    return runTestScript(command);
}
