Addendum: Test Batch Bypassing the Main Batch API
1. Rationale
Faster Feedback: By calling the AI model API directly (instead of the row-by-row batch mechanism), the user can quickly see results for a small subset of data.
No Queuing Delay: The main batch pipeline might have concurrency controls, queuing, or rate-limiting that slow down runs. Test Batch calls are lighter and designed for near-immediate feedback.
Resource Efficiency: The Test Batch calls only process a handful of rows, avoiding overhead in the full batch pipeline.
2. Implementation Details
FR-TB5: Direct Model API Calls for Test

When the user selects “Test Batch” (subset of, say, 5–10 rows), the system will:
Load the chosen rows from the locally stored CSV/Excel file.
For each row, directly call the chosen AI endpoint (e.g., POST /v1/chat/completions for OpenAI) rather than sending them through the batch workflow or queue.
Capture responses and display them immediately in the UI.
FR-TB6: Minimal Waiting

Because the test calls skip any overhead in the main batch pipeline, users can see results within seconds (subject to standard API latency).
FR-TB7: Separate Test Logic

Create a test-specific function or module in the client code (e.g., runTestBatch(rows, modelConfig)) that handles these direct calls.
The main batch engine remains unchanged for the full run.
3. User Flow (Revised)
Open Batch Details: User configures prompts, parameters, model, etc.
Click “Test Batch”:
UI prompts user to choose the number of rows (or defaults to 5–10).
System directly calls the AI model API for each row.
Instant Results: The responses appear in a small table or log output, letting the user confirm correctness or refine prompts.
(Optional) Full Batch: If the user is satisfied with the test results, they proceed to run the entire dataset through the normal batch pipeline.
4. Cost Calculator Considerations
Same Rate Calculation: The cost estimate for the test subset is straightforward (only 5–10 rows times the approximate tokens).
No Additional Pipeline Overhead: Since it’s a direct call, the “batch overhead” cost (if any) is negligible.
5. Edge Cases
Rate Limits: Even though these calls skip the full pipeline, the user might still face API provider rate limits if they test multiple times in quick succession.
Small Files: If the file has fewer than 5–10 rows total, the test effectively processes the entire file. That’s still simpler than running the full pipeline logic.
Error Handling: If direct model calls fail (bad key, prompt errors), show immediate error messages in the test results area.