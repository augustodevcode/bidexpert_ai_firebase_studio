# Project Context System - Instructions for AI (BidExpert)

These files (`PROJECT_CONTEXT_HISTORY.md`, `PROJECT_PROGRESS.MD`, `PROJECT_INSTRUCTIONS.md` (this file), `1st.md`) are designed to help you, the AI, maintain context and continuity across our development sessions for the BidExpert project. Please follow these instructions to ensure they are used effectively.

## 1. Initialization at the Start of a Session

*   At the beginning of each new session (or after a context reset), I (the user) will provide you with an initialization prompt, typically the content of `1st.md`.
*   Your **first task** upon receiving this prompt is to **read and process the information** contained in:
    *   `PROJECT_CONTEXT_HISTORY.md` (for project background, decisions, and past work)
    *   `PROJECT_PROGRESS.MD` (for current status and next steps)
    *   `PROJECT_INSTRUCTIONS.md` (these instructions, as a reminder)
*   After processing these files, you should **confirm** that you have read and understood their content before we proceed with other tasks.
*   You can then ask if I have any specific focus or updates for the current session.

## 2. Updating the Context Files

*   **Regular Updates:** You should aim to update these context files regularly, especially:
    *   After significant progress is made on a feature or a numbered item from our list.
    *   When new objectives or features are defined.
    *   When important technical or design decisions are made.
    *   When major errors are resolved.
    *   At the end of a development block or before an anticipated session break, if requested by the user.
*   **How to Update:** You will propose changes to these files using the standard XML `<changes>` format, providing the full intended content for each file being updated. Ensure the file path is absolute, e.g., `/home/user/studio/context/PROJECT_CONTEXT_HISTORY.md`.

*   **`PROJECT_CONTEXT_HISTORY.md`:**
    *   **Append or Merge new information.** Do not simply overwrite the entire file if a previous summary exists. Instead, integrate new developments into the existing structure, particularly under the "Development Summary (Based on Interactions)" section.
    *   Summarize key discussions, decisions made, features implemented (referencing item numbers if applicable), and the outcome of tasks from the current session or since the last update.
    *   Include details about challenges encountered and how they were resolved (e.g., specific errors and their fixes).
    *   Maintain a generally chronological flow within the development summary section.
    *   Be comprehensive but concise. Ensure the history covers the Project Overview, Key Features, Major Decisions, and a log of significant errors/fixes.

*   **`PROJECT_PROGRESS.MD`:**
    *   Update the status of tasks by moving items between "DONE", "DOING", and "NEXT".
    *   Add newly identified tasks or features (potentially with item numbers) to the "NEXT" section.
    *   Reflect the current development focus in the "DOING" section.
    *   Use clear, actionable bullet points. Ensure "DONE" items are accurately moved from "DOING" or "NEXT".
    *   If an item is partially done, it can remain in "DOING" with a note on what's pending, or the completed sub-tasks can be moved to "DONE".

*   **`PROJECT_INSTRUCTIONS.md` (This File):**
    *   Update these instructions if our process for using or updating the context files changes. This file is primarily for your reference.

*   **`1st.md`:**
    *   This file contains the prompt I (the user) will give you. It should generally not change unless our core initialization process changes.

## 3. Using the Context Files During a Session

*   **Consult Regularly:** Refer to `PROJECT_CONTEXT_HISTORY.md` to recall past discussions, decisions, or technical details.
*   **Track Progress:** Use `PROJECT_PROGRESS.MD` to understand the current project state and identify priorities.
*   **Inform Responses:** Use the information from these files to:
    *   Provide consistent and contextually aware responses.
    *   Generate code that aligns with previous decisions and the overall architecture.
    *   Make suggestions that are relevant to the project's goals and current state.
    *   Understand the "Item X" references made by the user.

## 4. Maintaining File Integrity

*   Ensure the markdown formatting remains consistent and readable.
*   If you are unsure about how to update a file or what to include, please ask for clarification.
*   When providing file content for these context files, always provide the *entire* intended content within the `<![CDATA[...` block.

## 5. Project-Specific Conventions

*   **Development Environment:** Remember that in the development environment (`NODE_ENV === 'development'`), we have an automatic login mechanism for the `admin@bidexpert.com.br` user. This is handled in `src/contexts/auth-context.tsx` to streamline development and testing.

By diligently following these instructions, we can build and maintain a persistent context that will greatly enhance the efficiency and effectiveness of our collaboration on the BidExpert project.
