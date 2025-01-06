import { getSettings } from './db';
import type { AIParams, ColumnRange, RowRange } from './db';

interface AIResponse {
  content: string;
  error?: string;
  tokens?: number;
}

export async function processWithAI(
  prompt: string,
  systemPrompt?: string,
  params?: AIParams,
  signal?: AbortSignal,
): Promise<AIResponse> {
  const settings = await getSettings();
  if (!settings?.apiKey) {
    throw new Error('API key not configured');
  }

  const aiParams = params || settings.defaultAIParams || {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 2048,
    presencePenalty: 0,
    topP: 1,
    concurrency: 1,
  };

  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: prompt },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: aiParams.model,
        messages,
        temperature: aiParams.temperature,
        max_tokens: aiParams.maxTokens,
        presence_penalty: aiParams.presencePenalty,
        top_p: aiParams.topP,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      tokens: data.usage.total_tokens,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export function estimateCost(
  rowCount: number,
  avgTokensPerRow: number = 1000,
  model: string = 'gpt-3.5-turbo',
): number {
  // OpenAI pricing per 1K tokens (as of 2024)
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'gpt-4': { input: 0.03, output: 0.06 },
  };

  const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
  const totalTokens = rowCount * avgTokensPerRow;
  const inputCost = (totalTokens / 2 / 1000) * modelPricing.input;
  const outputCost = (totalTokens / 2 / 1000) * modelPricing.output;

  return inputCost + outputCost;
}

function filterColumns(row: any, columnRange?: ColumnRange): any {
  if (!columnRange) return row;

  const allColumns = Object.keys(row);
  const startIndex = allColumns.indexOf(columnRange.start);
  const endIndex = allColumns.indexOf(columnRange.end);
  
  if (startIndex === -1 || endIndex === -1) return row;

  const selectedColumns = allColumns.slice(
    Math.min(startIndex, endIndex),
    Math.max(startIndex, endIndex) + 1,
  );

  if (selectedColumns.length === 0) return row;

  const filteredRow: any = {};
  selectedColumns.forEach((column) => {
    filteredRow[column] = row[column];
  });
  return filteredRow;
}

function filterRows(rows: any[], rowRange?: RowRange): any[] {
  if (!rowRange) return rows;

  const start = rowRange.start || 1;
  const end = rowRange.end || rows.length;

  return rows.slice(start - 1, end);
}

export async function processBatch(
  rows: any[],
  prompt: string,
  systemPrompt?: string,
  aiParams?: AIParams,
  onProgress?: (progress: number, processedRows: number, totalRows: number) => void,
  signal?: AbortSignal,
  columnRange?: ColumnRange,
  rowRange?: RowRange,
): Promise<any[]> {
  const filteredRows = filterRows(rows, rowRange);
  const results = [];
  let processed = 0;
  const concurrency = aiParams?.concurrency || 1;
  const chunks = chunkArray(filteredRows, concurrency);

  for (const chunk of chunks) {
    if (signal?.aborted) {
      throw new DOMException('Batch processing cancelled', 'AbortError');
    }

    const chunkPromises = chunk.map(async (row) => {
      const filteredRow = filterColumns(row, columnRange);
      const interpolatedPrompt = prompt.replace(
        /{{(\w+)}}/g,
        (_, key) => filteredRow[key] ?? `{{${key}}}`,
      );

      const result = await processWithAI(interpolatedPrompt, systemPrompt, aiParams, signal);
      
      return {
        ...row,
        result: result.content,
        error: result.error,
        tokens: result.tokens,
      };
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);

    processed += chunk.length;
    onProgress?.(
      Math.round((processed / filteredRows.length) * 100),
      processed,
      filteredRows.length,
    );
  }

  return results;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export interface TestResult {
  row: any;
  result: AIResponse;
}

export async function runTestBatch(
  rows: any[],
  prompt: string,
  systemPrompt?: string,
  aiParams?: AIParams,
  columnRange?: ColumnRange,
  rowRange?: RowRange,
  numTestRows: number = 5
): Promise<TestResult[]> {
  // Filter rows based on range if provided
  const filteredRows = filterRows(rows, rowRange);
  
  // Take first N rows for testing
  const testRows = filteredRows.slice(0, Math.min(numTestRows, filteredRows.length));
  
  const results: TestResult[] = [];
  
  for (const row of testRows) {
    const filteredRow = filterColumns(row, columnRange);
    const interpolatedPrompt = prompt.replace(
      /{{(\w+)}}/g,
      (_, key) => filteredRow[key] ?? `{{${key}}}`,
    );

    const result = await processWithAI(interpolatedPrompt, systemPrompt, aiParams);
    results.push({
      row: filteredRow,
      result,
    });
  }

  return results;
} 