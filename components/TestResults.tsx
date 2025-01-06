'use client';

import { TestResult } from '@/lib/ai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TestResultsProps {
  results: TestResult[];
  isLoading?: boolean;
  error?: string;
}

export default function TestResults({ results, isLoading, error }: TestResultsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Running Test Batch...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Test Failed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!results.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Results</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {results.map((result, index) => (
            <div key={index} className="mb-6 last:mb-0">
              <div className="mb-2">
                <h4 className="font-medium text-sm text-gray-500">Input Row {index + 1}:</h4>
                <pre className="bg-gray-50 p-2 rounded-md text-sm">
                  {JSON.stringify(result.row, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-500">AI Response:</h4>
                <div className="bg-gray-50 p-2 rounded-md">
                  {result.result.error ? (
                    <p className="text-red-600 text-sm">{result.result.error}</p>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{result.result.content}</p>
                  )}
                  {result.result.tokens && (
                    <p className="text-xs text-gray-500 mt-1">
                      Tokens used: {result.result.tokens}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 