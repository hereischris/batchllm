1. Overview
1.1 Product Vision
A web application enabling batch AI prompt processing using local CSV/Excel files, no-code prompt configuration, and direct calls to AI services. All data remains stored locally (IndexedDB), giving users full control over their data. The interface uses a floating navbar for easy navigation among pages (Home, Batches, Settings, etc.).

1.2 Target Users
Content/Marketing Teams: Bulk-generate product descriptions, taglines, or copy using row-by-row data.
Data Analysts & Researchers: Quickly experiment with summarization, classification, or transformations.
Developers/Prototypers: Rapidly test AI prompts at scale without custom scripts.
1.3 Key Objectives
Local‐First: All CSV/Excel data, batch configurations, prompts, and results stay in the browser (IndexedDB).
Scalable: Handle up to ~50k rows, with optional concurrency settings to speed up processing.
Transparent: Provide real‐time progress, cost estimation, and easy cancellation for running batches.
Flexible: Let users define system prompts, user prompts, advanced AI parameters (temperature, max tokens, presence penalty, etc.), plus partial usage of data (start/end columns or rows).
2. Functional Requirements
2.1 Floating Navbar (Top‐Centered)
FR1.1: The floating navbar stays pinned at the top center, with links to:
Home (Dashboard or Welcome)
Batches (Overview of uploaded files and associated batches)
Settings (API keys, default parameters)
Login (If authentication is needed; optional for MVP)
FR1.2: It remains visible on all pages, allowing users to jump between sections without a strict wizard flow.
2.2 Home (Dashboard) Page
FR2.1: A landing page that briefly explains the app’s capabilities and provides a “Get Started” or “Upload File” button.
FR2.2: Possibly display key stats (e.g., total batches, recent uploads).
2.3 File Upload & Preview Page
FR3.1: Users can upload CSV or Excel files from their local machine.
FR3.2: The file is parsed client‐side, and a table preview of the contents is shown (first N rows).
FR3.3: The user can name the batch (or do so later) and store the file in IndexedDB.
FR3.4: Define columns or row ranges:
Users can specify which columns (or a “start column” and “end column”) to include in the prompt process.
Users can optionally define a “start row” and “end row” if they only want to process a subset of the data.
FR3.5: Saved files appear in the Batches overview for further configuration.
2.4 Batches Page (Overview Table)
FR4.1: Displays a list of all stored files and their batches; columns might include:
File name / Batch name
Creation date
Status (Pending, In Progress, Completed, Cancelled)
Actions (View details, run, download results, etc.)
FR4.2: Filtering or searching by batch state (e.g., show only “In Progress” or “Completed”).
FR4.3: Clicking a batch row opens its detail view or re-opens a file preview.
2.5 Batch Details Page
FR5.1: Shows or edits batch configuration:
File reference (rows/columns in use)
AI parameters: model type (OpenAI, Google), max tokens, temperature, presence penalty, top_p, etc.
Cost estimation: approximate cost based on token limits.
FR5.2: Allows prompt engineering:
System prompt (context/instructions)
User prompt (main request or references to CSV columns for dynamic prompts)
Possibly advanced “multiple columns” references if needed.
FR5.3: Concurrency setting (optional) letting users specify how many parallel requests to run (if not limited by the AI API).
FR5.4: A “Run Batch” or “Re‐run Batch” button to kick off processing.
2.6 Key Entering (Settings Page or Popup)
FR6.1: Users can enter their own API key (e.g., for OpenAI, Google) in a secure local form.
FR6.2: The app stores the API key locally (IndexedDB or localStorage) and never sends it to a backend.
FR6.3: Provide a small “Test Key” button to confirm validity (optional).
2.7 Progress View (During Batch Execution)
FR7.1: As the batch runs, display real‐time progress (rows processed vs. total).
FR7.2: Optionally show row‐by‐row logs or a simple overall progress bar.
FR7.3: Cancel button: Users can cancel the batch mid-run if needed (cost concerns, wrong prompt, etc.).
FR7.4: If an error occurs (e.g., rate limit, invalid key), the system logs the issue in a local status field.
2.8 Result Download
FR8.1: Upon completion, the app merges original data with AI outputs (new columns) and generates a downloadable CSV/Excel.
FR8.2: The user can re-run or refine prompts and save a new version (creating multiple “runs” per file).
3. Non‐Functional Requirements
Technology Stack

NFR1.1: Built with Next.js for the front end.
NFR1.2: IndexedDB or local storage for all user data (files, config, prompts, keys).
Local‐Only Data Storage

NFR2.1: No server–side storage. The webserver only delivers static files for the UI.
NFR2.2: All user data remains on the client, except for direct API calls to AI providers.
Performance & Scalability

NFR3.1: Handle up to ~50k rows, using chunked or concurrent processing to avoid UI lockups.
NFR3.2: Provide concurrency options in the UI to help manage performance and rate limits.
Reliability & Error Handling

NFR4.1: Show clear errors for invalid file formats, AI API issues, or partial batch failures.
NFR4.2: Support partial or “cancelled” runs. Give the user an option to download partial results or re-run later.
Usability

NFR5.1: The floating navbar remains visible, ensuring quick navigation among Home, Batches, Settings.
NFR5.2: Provide a straightforward layout for each page (Upload, Batches Overview, Batch Details, Progress).
NFR5.3: Include tooltips or small explanations for advanced parameters (max tokens, presence penalty, etc.).
Future Cloud Readiness

NFR6.1: Code structure should allow switching to or adding a backend solution if collaboration or multi‐user features become necessary.
4. Detailed Architecture (Local‐First)
sql
Code kopieren
                       (Floating Navbar)
             +-----------------------------------+
             |  Home   |  Batches  |  Settings   |  ... 
             +-----------------------------------+
                         (Next.js Routes)
                           /      |       \
                          /       |        \
                         /        |         \
+------------------+  +-------------------+  +------------------+
|  Home (Dashboard)|  | Batches Overview  |  | Settings (API Key)
|  - Explanation   |  |  - Table of files |  |  - Key entry     |
|  - "Upload" CTA  |  |  - Filter by state|  |  - Defaults      |
+------------------+  +-------------------+  +------------------+
           \              /           \
            \            /             \
             v          v               v
  +------------------------------------------------+
  |               Upload/Preview Page              |
  | - CSV/Excel parse, define columns/rows range   |
  | - Save to IndexedDB w/ batch name + details    |
  +------------------------------------------------+
                                 |
                                 v
                    +------------------------------+
                    |  Batch Details (Config)      |
                    | - Prompt Engineering         |
                    | - AI Params (temp, tokens...)|
                    | - Cost estimation            |
                    | - Concurrency setting        |
                    +--------------+---------------+
                                   |
                                   v
                     +-------------------------------+
                     |   Batch Processing (Progress) |
                     |   - Real-time row updates     |
                     |   - Cancel option             |
                     +---------------+---------------+
                                     |
                                     v
                    +-----------------------------------+
                    |   Results (Download New CSV/Excel) |
                    +-----------------------------------+
Client‐Side Data: Everything is stored in IndexedDB, including file contents, batch configs, and AI results.
AI Calls: The user’s browser calls OpenAI/Google APIs directly with the user’s key.
Progress: A small client‐side “worker” or loop processes each row, logs statuses, and updates IndexedDB accordingly.
Concurrency: If allowed, multiple parallel calls can happen to speed things up (limited by user’s or API’s constraints).
5. Ensuring Full Coverage of the Story Map
CSV/Excel Upload: Storing files locally, preview in table, define columns/rows.
New Batch Overview & Cost Estimation:
The Batches or Batch Details page includes cost estimation fields (max tokens, temperature).
The user can see approximate usage before running.
Prompt Engineering:
System & user prompts, advanced parameters (presence penalty, top_p, concurrency).
Key Entering:
Handled in the Settings page (or a modal).
Progress View:
Real‐time progress, ability to cancel, filter or see statuses in the Batches Overview.
Result Download:
Export final AI outputs appended to original CSV.
All these points directly map to the post‐it notes in the story map and the identified user tasks.

6. Success Metrics
Batch Creation Rate: Number of new batches users create weekly.
Completion Ratio: Percentage of batches successfully completed (vs. cancelled or errored).
Average Processing Time: From start to finish for typical CSV sizes.
User Retention: Frequency of returning users who create multiple batches over time.
7. Roadmap
MVP

Local storage (IndexedDB)
Single model integration (OpenAI GPT‐3.5 or GPT‐4)
Basic concurrency & partial cancellation
CSV/Excel import, prompt config, progress tracking, result download
Phase 2

Additional AI providers (Google PaLM, etc.)
Enhanced error handling, partial re-run
More advanced cost breakdowns
Row‐by‐row or “column mapping” for more flexible prompt usage
Phase 3

Cloud/Server option for multi-user collaboration
Role-based access, shared prompts, usage analytics
Advanced features: prompt chaining, complex transformations
8. Assumptions & Open Questions
API Rate Limits: Large files might require concurrency throttling.
File Size Constraints: Browsers vary in memory capacity; ~50k rows is a typical upper bound.
Key Storage: Do we store the key in localStorage, IndexedDB, or ephemeral session? Each has trade-offs.
User Authentication: If a “Login” link is used, do we eventually store sessions or user profiles? For MVP, login might be optional.
Splitting/Batching: Confirm how “start row/end row” or multiple sub-batches are best displayed in the UI.
Conclusion
This updated PRD adopts a multi‐page web app with a floating top‐centered navbar and explicitly addresses every feature from the original story map:

CSV/Excel Upload (local storage, preview, naming, start/end columns/rows).
New Batch Overview & Cost Estimation (Batch Details page).
Prompt Engineering (system/user prompt, advanced parameters).
Key Entering (Settings page).
Progress View (real-time updates, cancellation).
Result Download (append AI outputs, export to CSV/Excel