
# Project Context System - Instructions for AI (BidExpert)

These files (`PROJECT_CONTEXT_HISTORY.md`, `PROJECT_PROGRESS.MD`, `PROJECT_INSTRUCTIONS.md`, `1st.md`) are designed to help you, the AI, maintain context and continuity across our development sessions for the BidExpert project. Please follow these instructions to ensure they are used effectively.

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
    *   After significant progress is made on a feature.
    *   When new objectives or features are defined.
    *   When important technical or design decisions are made.
    *   When major errors are resolved.
    *   At the end of a development block or before an anticipated session break.
*   **How to Update:** You will propose changes to these files using the standard XML `<changes>` format, providing the full intended content for each file being updated.

*   **`PROJECT_CONTEXT_HISTORY.md`:**
    *   **Append new information.** Do not overwrite the entire file unless explicitly creating a new summary after a full context reset (like this current one).
    *   Summarize key discussions, decisions made, features implemented, and the outcome of tasks from the current session.
    *   Include details about challenges encountered and how they were resolved (e.g., specific errors and their fixes).
    *   Maintain a generally chronological flow. If a previous summary exists, append to it, often under a new heading like "Session [Date/Number] - Focus: [Brief Description]".
    *   Be comprehensive but concise.

*   **`PROJECT_PROGRESS.MD`:**
    *   Update the status of tasks by moving items between "DONE", "WORKING", and "NEXT".
    *   Add newly identified tasks or features to the "NEXT" section.
    *   Reflect the current development focus in the "WORKING" section.
    *   Use clear, actionable bullet points.

*   **`PROJECT_INSTRUCTIONS.md` (This File):**
    *   Update these instructions if our process for using or updating the context files changes. This file is primarily for your reference.

*   **`1st.md`:**
    *   This file contains the prompt I will give you. It should generally not change unless our core initialization process changes.

## 3. Using the Context Files During a Session

*   **Consult Regularly:** Refer to `PROJECT_CONTEXT_HISTORY.md` to recall past discussions, decisions, or technical details.
*   **Track Progress:** Use `PROJECT_PROGRESS.MD` to understand the current project state and identify priorities.
*   **Inform Responses:** Use the information from these files to:
    *   Provide consistent and contextually aware responses.
    *   Generate code that aligns with previous decisions and the overall architecture.
    *   Make suggestions that are relevant to the project's goals and current state.

## 4. Maintaining File Integrity

*   Ensure the markdown formatting remains consistent and readable.
*   If you are unsure about how to update a file or what to include, please ask for clarification.

By diligently following these instructions, we can build and maintain a persistent context that will greatly enhance the efficiency and effectiveness of our collaboration on the BidExpert project.
```
  
    