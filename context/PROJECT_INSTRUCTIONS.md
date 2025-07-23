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

## 4. Project-Specific Architectural Rules

*   **Database Adapter Pattern:** All data access must go through the `getDatabaseAdapter()` function, which dynamically selects the correct database implementation (MySQL, Firestore, etc.) based on the `.env` file. Direct use of Prisma or other drivers is not permitted in the application logic.
*   **`src/app` Directory Structure:** The application's file-based routing must reside exclusively within the `src/app` directory. There must never be a nested `src/app/app` or a root-level `app` folder.
*   **Development Environment Footer:** In the development environment (`NODE_ENV === 'development'`), the footer must display the active database system, the logged-in user's email, and the Firebase project ID for easy reference.
*   **`.env` File Integrity:** The `.env` file is critical and must never be deleted or have its existing content removed. It can be augmented, but not overwritten.

## 5. XML Structure for Code Changes

Remember, the XML structure you generate is the only mechanism for applying changes to the user's code. Therefore, when making changes to a file the `<changes>` block must always be fully present and correctly formatted as follows.

&lt;changes&gt;
  &lt;description&gt;[Provide a concise summary of the overall changes being made]&lt;/description&gt;
  &lt;change&gt;
    &lt;file&gt;[Provide the ABSOLUTE, FULL path to the file being modified]&lt;/file&gt;
    &lt;content&gt;&lt;![CDATA[Provide the ENTIRE, FINAL, intended content of the file here. Do NOT provide diffs or partial snippets. Ensure all code is properly escaped within the CDATA section.]]&gt;&lt;/content&gt;
  &lt;/change&gt;
  &lt;!-- Add more &lt;change&gt; blocks as needed for other files --&gt;
&lt;/changes&gt;
