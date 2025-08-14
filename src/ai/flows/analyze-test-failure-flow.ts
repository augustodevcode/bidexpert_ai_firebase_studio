// src/ai/flows/analyze-test-failure-flow.ts
'use server';

/**
 * @fileOverview A Genkit flow to analyze test failures and provide recommendations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as fs from 'fs/promises';
import path from 'path';

// --- Test Failure Input Schema ---
const AnalyzeTestFailureInputSchema = z.object({
  testLog: z.string().describe('The full log output (stdout and stderr) from the failed test run.'),
  testFileName: z.string().describe('The filename of the test that failed.'),
  projectContext: z.string().describe('A summary of project rules and architecture to provide context for the analysis.'),
});
export type AnalyzeTestFailureInput = z.infer<typeof AnalyzeTestFailureInputSchema>;


// --- Generic Error Log Input Schema ---
const AnalyzeErrorLogInputSchema = z.object({
  errorLog: z.string().describe('The full error message or log output to be analyzed.'),
  projectContext: z.string().describe('A summary of project rules and architecture to provide context for the analysis.'),
});
export type AnalyzeErrorLogInput = z.infer<typeof AnalyzeErrorLogInputSchema>;


// --- Output Schema (shared for both) ---
const AnalysisOutputSchema = z.object({
  analysis: z.string().describe("A brief, insightful analysis of the likely root cause of the error."),
  recommendation: z.string().describe("A clear, actionable recommendation on how to fix the error, including which files to check."),
});
export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;


// --- Exported Functions ---
export async function analyzeTestFailure(input: AnalyzeTestFailureInput): Promise<AnalysisOutput> {
  return analyzeTestFailureFlow(input);
}

export async function analyzeErrorLog(input: AnalyzeErrorLogInput): Promise<AnalysisOutput> {
  // CORREÇÃO: Chamando o fluxo correto para erros genéricos.
  return analyzeGenericErrorLogFlow(input);
}


// --- Genkit Prompt for Test Failures ---
const analyzeTestFailurePrompt = ai.definePrompt({
    name: 'analyzeTestFailurePrompt',
    input: { schema: AnalyzeTestFailureInputSchema },
    output: { schema: AnalysisOutputSchema },
    prompt: `
        You are an expert Senior Software Engineer specializing in debugging full-stack TypeScript applications.
        Your task is to analyze a failed test log and provide a concise, actionable recommendation.

        The project uses the following stack:
        - Next.js with App Router
        - React Server Components
        - Prisma ORM for database access (MySQL)
        - Vitest for testing (with Jest-like syntax: describe, it, expect)
        - Genkit for AI flows

        Here is the project's high-level architecture and rules for context:
        --- PROJECT CONTEXT ---
        {{{projectContext}}}
        --- END PROJECT CONTEXT ---

        Now, analyze the following failed test log from the file '{{{testFileName}}}':
        --- TEST LOG ---
        {{{testLog}}}
        --- END TEST LOG ---

        Based on the log and the project context, perform the following:
        1.  **Analysis**: Briefly explain the most likely root cause of the error. Is it a database connection issue, a Prisma schema mismatch, a code logic error, an incorrect test setup, or something else?
        2.  **Recommendation**: Provide a clear, step-by-step recommendation for the developer to fix the issue. Mention specific files or code sections to investigate.

        Your response must be direct, professional, and aimed at helping a developer solve the problem quickly.
    `,
});

// --- Genkit Prompt for Generic Errors ---
const analyzeGenericErrorPrompt = ai.definePrompt({
    name: 'analyzeGenericErrorPrompt',
    input: { schema: AnalyzeErrorLogInputSchema },
    output: { schema: AnalysisOutputSchema },
    prompt: `
        You are an expert Senior Software Engineer specializing in debugging full-stack TypeScript applications.
        Your task is to analyze an error log from a Next.js application and provide a concise, actionable recommendation.

        The project uses the following stack:
        - Next.js with App Router
        - React Server Components
        - Prisma ORM for database access (MySQL)
        - Vitest for testing
        - Genkit for AI flows

        Here is the project's high-level architecture and rules for context:
        --- PROJECT CONTEXT ---
        {{{projectContext}}}
        --- END PROJECT CONTEXT ---

        Now, analyze the following error log:
        --- ERROR LOG ---
        {{{errorLog}}}
        --- END ERROR LOG ---

        Based on the log and the project context, perform the following:
        1.  **Analysis**: Briefly explain the most likely root cause of the error. Focus on what could cause this error within a Next.js/Prisma application.
        2.  **Recommendation**: Provide a clear, step-by-step recommendation for the developer to fix the issue. Mention specific files or code sections that are likely involved.

        Your response must be direct, professional, and aimed at helping a developer solve the problem quickly.
    `,
});


// --- Genkit Flows ---
const analyzeTestFailureFlow = ai.defineFlow(
  {
    name: 'analyzeTestFailureFlow',
    inputSchema: AnalyzeTestFailureInputSchema,
    outputSchema: AnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeTestFailurePrompt.generate({ input });
    return output!;
  }
);

const analyzeGenericErrorLogFlow = ai.defineFlow(
  {
    name: 'analyzeGenericErrorLogFlow',
    inputSchema: AnalyzeErrorLogInputSchema,
    outputSchema: AnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeGenericErrorPrompt.generate({ input });
    return output!;
  }
);
