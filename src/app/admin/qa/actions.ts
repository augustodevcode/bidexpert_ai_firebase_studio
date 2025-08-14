// src/app/admin/qa/actions.ts
/**
 * @fileoverview Server Actions for the Quality Assurance (QA) panel.
 * These actions execute predefined test scripts using `node:child_process`
 * and return the stdout and stderr for display in the UI.
 * If a test fails, it invokes an AI flow to analyze the error and provide a recommendation.
 */
'use server';

import { exec } from 'child_process';
import util from 'util';
import { analyzeTestFailure, analyzeErrorLog } from '@/ai/flows/analyze-test-failure-flow'; // Import analyzeErrorLog
import * as fs from 'fs/promises';
import path from 'path';

const execPromise = util.promisify(exec);

// Helper function to read project context files for the AI
async function getProjectContextForAI(): Promise<string> {
    try {
        const rulesPath = path.join(process.cwd(), 'airules.MD');
        const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
        
        const [rulesContent, schemaContent] = await Promise.all([
            fs.readFile(rulesPath, 'utf-8'),
            fs.readFile(schemaPath, 'utf-8')
        ]);

        return `
            **Project Rules (airules.MD):**
            ${rulesContent}

            ---

            **Database Schema (prisma/schema.prisma):**
            ${schemaContent}
        `;
    } catch (error) {
        console.error("Error reading project context for AI:", error);
        return "Could not load project context. Please analyze the log based on general best practices for a Next.js/Prisma application.";
    }
}


// Helper function to run a test script and handle output/errors, now with AI analysis
async function runTestAndAnalyze(command: string, testFileName: string): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    console.log(`[QA Action] Running command: ${command}`);
    try {
        const { stdout, stderr } = await execPromise(command);

        if (stderr) {
            if (stderr.includes('# fail') || stderr.toLowerCase().includes('error')) {
                 console.error(`[QA Action] Test execution has stderr failures for command "${command}":`, stderr);
                 throw new Error(stderr); // Throw to trigger AI analysis
            }
             console.log(`[QA Action] Test executed with stderr but no failures for command "${command}":`, stderr);
        }
        
        console.log(`[QA Action] Test executed successfully for command "${command}". stdout:`, stdout);
        return { success: true, output: stdout + (stderr ? `\n--- STDERR (No Failures) ---\n${stderr}` : '') };

    } catch (error: any) {
        console.error(`[QA Action] Error executing test script "${command}":`, error);
        const outputLog = error.stdout || '';
        const errorLog = error.stderr || error.message;
        const fullLog = `--- STDOUT ---\n${outputLog}\n\n--- STDERR ---\n${errorLog}`;

        try {
            console.log("[QA Action] Test failed. Invoking AI analysis flow...");
            const projectContext = await getProjectContextForAI();
            const analysisResult = await analyzeTestFailure({
                testLog: fullLog,
                testFileName: testFileName,
                projectContext: projectContext,
            });

            const recommendation = `
================================================
🤖 ANÁLISE E RECOMENDAÇÃO DA IA 🤖
================================================

🔍 **Análise:**
${analysisResult.analysis}

💡 **Recomendação:**
${analysisResult.recommendation}

================================================
`;
            return { success: false, output: fullLog, error: errorLog, recommendation };

        } catch (aiError: any) {
            console.error("[QA Action] Error during AI analysis:", aiError);
            const recommendation = "\n\n[ANÁLISE DA IA FALHOU]: Não foi possível analisar o erro automaticamente.";
            return { success: false, output: fullLog, error: errorLog, recommendation };
        }
    }
}

/**
 * Action to analyze a generic error log with AI.
 */
export async function analyzeErrorLogAction(errorLog: string): Promise<{ success: boolean; analysis: string; recommendation: string }> {
  try {
    const projectContext = await getProjectContextForAI();
    const result = await analyzeErrorLog({
      errorLog: errorLog,
      projectContext: projectContext,
    });
    return { success: true, ...result };
  } catch (error: any) {
    console.error("Error calling AI analysis for error log:", error);
    return {
      success: false,
      analysis: "Falha na Análise",
      recommendation: `Não foi possível conectar ao serviço de IA para analisar o erro: ${error.message}`
    };
  }
}


export async function runBiddingEndToEndTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/bidding-e2e.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runSearchAndFilterTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/search-and-filter.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}


// --- Rest of the functions would follow the same pattern ---
export async function runHabilitationEndToEndTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/habilitation.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runMenuContentTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/menu-content.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runModalitiesMenuTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/modalities-menu.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runUserEndToEndTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/user.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runSellerEndToEndTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/seller.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runAuctioneerEndToEndTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/auctioneer.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runCategoryEndToEndTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/category.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runSubcategoryEndToEndTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/subcategory.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runRoleEndToEndTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/role.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runStateEndToEndTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/state.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runCityEndToEndTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/city.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runCourtEndToEndTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/court.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runJudicialDistrictEndToEndTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/judicial-district.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runJudicialBranchEndToEndTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/judicial-branch.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runJudicialProcessEndToEndTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/judicial-process.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runBemEndToEndTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/bem.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runLotEndToEndTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/lot.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runWizardEndToEndTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/wizard-e2e.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runMediaLibraryEndToEndTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/media.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runPlatformSettingsTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/platform-settings.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}

export async function runAuctionDataValidationTest(): Promise<{ success: boolean; output: string; error?: string; recommendation?: string; }> {
    const testFile = 'tests/auction-data.test.ts';
    const command = `NODE_ENV=test vitest run ${testFile}`;
    return runTestAndAnalyze(command, testFile);
}
