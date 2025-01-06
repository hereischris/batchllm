'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Batch, ColumnRange, RowRange, File } from '@/lib/db';
import { runTestBatch, type TestResult, estimateCost } from '@/lib/ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import TestResults from '@/components/TestResults';
import { FileSelect } from '@/components/FileSelect';

interface BatchFormProps {
  batch?: Batch;
  fileData?: any[];
  files?: File[];
  isReadOnly?: boolean;
  onSubmit?: (data: Partial<Batch>) => void;
  onFileSelect?: (fileId: string) => void;
}

type AIModel = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-2';

interface FormState {
  name: string;
  description: string;
  systemPrompt: string;
  prompt: string;
  columnRange: ColumnRange;
  rowRange: RowRange;
  concurrency: number;
  model: AIModel;
  temperature: number;
  maxTokens: number;
  presencePenalty: number;
  topP: number;
}

export default function BatchForm({ batch, fileData, files = [], isReadOnly = false, onSubmit, onFileSelect }: BatchFormProps) {
  const [selectedFileId, setSelectedFileId] = useState<string>(batch?.fileId || '');

  // Update selectedFileId when batch or fileData changes
  useEffect(() => {
    if (batch?.fileId) {
      setSelectedFileId(batch.fileId);
    }
  }, [batch?.fileId]);

  const selectedFile = useMemo(() => files.find(f => f.id === selectedFileId), [files, selectedFileId]);

  const handleFileSelect = (fileId: string) => {
    setSelectedFileId(fileId);
    onFileSelect?.(fileId);
  };

  const [formData, setFormData] = useState<FormState>({
    name: batch?.name || '',
    description: batch?.description || '',
    systemPrompt: batch?.systemPrompt || '',
    prompt: batch?.prompt || '',
    columnRange: {
      start: batch?.columnRange?.start || '',
      end: batch?.columnRange?.end || '',
    },
    rowRange: {
      start: batch?.rowRange?.start ?? 0,
      end: batch?.rowRange?.end ?? (fileData ? Math.min(5, fileData.length) : 5),
    },
    concurrency: batch?.concurrency || 1,
    model: (batch?.model as AIModel) || 'gpt-4',
    temperature: batch?.temperature || 0.7,
    maxTokens: batch?.maxTokens || 2000,
    presencePenalty: batch?.presencePenalty || 0,
    topP: batch?.topP || 1,
  });

  // Update form data when file changes
  useEffect(() => {
    if (selectedFile) {
      setFormData(prev => ({
        ...prev,
        rowRange: {
          start: 0,
          end: Math.min(5, selectedFile.rowCount),
        },
        columnRange: {
          start: '',
          end: '',
        }
      }));
    }
  }, [selectedFile]);
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testError, setTestError] = useState<string>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        ...formData,
        rowRange: {
          start: Number(formData.rowRange.start),
          end: Number(formData.rowRange.end),
        },
      });
    }
  };

  const handleTestBatch = async () => {
    if (!fileData) {
      setTestError('No file data available');
      return;
    }

    setIsTestLoading(true);
    setTestError(undefined);
    
    try {
      const results = await runTestBatch(
        fileData,
        formData.prompt,
        undefined, // system prompt (not implemented yet)
        {
          model: formData.model,
          temperature: formData.temperature,
          maxTokens: formData.maxTokens,
          presencePenalty: 0,
          topP: 1,
          concurrency: 1,
        },
        formData.columnRange,
        {
          start: Number(formData.rowRange.start),
          end: Number(formData.rowRange.end),
        }
      );
      
      setTestResults(results);
    } catch (error) {
      setTestError(error instanceof Error ? error.message : 'Failed to run test batch');
    } finally {
      setIsTestLoading(false);
    }
  };

  // Get available columns for dynamic prompts
  const availableColumns = useMemo(() => {
    if (!fileData || !fileData[0]) return [];
    return Object.keys(fileData[0]);
  }, [fileData]);

  // Calculate estimated cost
  const estimatedCost = useMemo(() => {
    if (!fileData || !selectedFile) return 0;
    const rowCount = formData.rowRange.end 
      ? formData.rowRange.end - (formData.rowRange.start || 0)
      : selectedFile.rowCount - (formData.rowRange.start || 0);
    return estimateCost(rowCount, formData.maxTokens, formData.model);
  }, [fileData, selectedFile, formData.rowRange, formData.maxTokens, formData.model]);

  // Validate row range against file size
  useEffect(() => {
    if (selectedFile && fileData) {
      setFormData(prev => {
        const maxRow = selectedFile.rowCount;
        const start = Math.min(prev.rowRange.start, maxRow - 1);
        const end = Math.min(prev.rowRange.end, maxRow);
        
        if (start !== prev.rowRange.start || end !== prev.rowRange.end) {
          return {
            ...prev,
            rowRange: { start, end }
          };
        }
        return prev;
      });
    }
  }, [selectedFile, fileData]);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* File Selection */}
      <Card>
        <CardHeader>
          <CardTitle>File Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="fileId">Select File</Label>
            <FileSelect
              files={files}
              value={selectedFileId}
              onSelect={handleFileSelect}
              disabled={isReadOnly}
            />
            {!files.length && (
              <p className="text-sm text-yellow-600">
                Please upload a file first before creating a batch.
              </p>
            )}
            {!selectedFileId && files.length > 0 && (
              <p className="text-sm text-gray-600">
                Select a file to configure your batch.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Only show the rest of the form if a file is selected */}
      {selectedFileId && fileData && selectedFile && (
        <Card>
          <CardHeader>
            <CardTitle>File Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Total Rows</Label>
                <p className="text-sm text-gray-600">{selectedFile.rowCount}</p>
              </div>
              <div>
                <Label>Available Columns</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {availableColumns.map((column) => (
                    <Badge key={column} variant="secondary">
                      {`{{${column}}}`}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Use the column references above in your prompt to insert values
                </p>
              </div>
              <div>
                <Label>Row Range</Label>
                <div className="flex space-x-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="rowStart">Start Row</Label>
                    <Input
                      id="rowStart"
                      type="number"
                      min={0}
                      max={selectedFile.rowCount - 1}
                      value={formData.rowRange.start}
                      onChange={(e) => setFormData({
                        ...formData,
                        rowRange: { 
                          ...formData.rowRange, 
                          start: parseInt(e.target.value) || 0 
                        }
                      })}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="rowEnd">End Row</Label>
                    <Input
                      id="rowEnd"
                      type="number"
                      min={formData.rowRange.start + 1}
                      max={selectedFile.rowCount}
                      value={formData.rowRange.end}
                      onChange={(e) => setFormData({
                        ...formData,
                        rowRange: { 
                          ...formData.rowRange, 
                          end: parseInt(e.target.value) || formData.rowRange.start + 1 
                        }
                      })}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Specify the range of rows to process (0-based indexing)
                </p>
              </div>
              <div>
                <Label>Estimated Cost</Label>
                <p className="text-sm text-gray-600">
                  ${estimatedCost.toFixed(4)} USD
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Batch Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isReadOnly}
            />
          </div>
        </CardContent>
      </Card>

      {/* Processing Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              rows={2}
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              disabled={isReadOnly}
              placeholder="Instructions or context for the AI model..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">User Prompt Template</Label>
            <Textarea
              id="prompt"
              rows={4}
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              disabled={isReadOnly}
              placeholder="Your prompt with {{column}} references..."
            />
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Column Range</Label>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Start"
                    value={formData.columnRange.start}
                    onChange={(e) => setFormData({
                      ...formData,
                      columnRange: { ...formData.columnRange, start: e.target.value }
                    })}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    placeholder="End"
                    value={formData.columnRange.end}
                    onChange={(e) => setFormData({
                      ...formData,
                      columnRange: { ...formData.columnRange, end: e.target.value }
                    })}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Row Range</Label>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Start"
                    value={formData.rowRange.start}
                    onChange={(e) => setFormData({
                      ...formData,
                      rowRange: { ...formData.rowRange, start: parseInt(e.target.value) || 0 }
                    })}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="End"
                    value={formData.rowRange.end}
                    onChange={(e) => setFormData({
                      ...formData,
                      rowRange: { ...formData.rowRange, end: parseInt(e.target.value) || 0 }
                    })}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle>AI Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select
              value={formData.model}
              onValueChange={(value: AIModel) => setFormData({ ...formData, model: value })}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="claude-2">Claude 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="concurrency">Concurrency</Label>
            <Input
              type="number"
              id="concurrency"
              min="1"
              max="10"
              value={formData.concurrency}
              onChange={(e) => setFormData({ ...formData, concurrency: parseInt(e.target.value) || 1 })}
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature">Temperature</Label>
            <Input
              type="number"
              id="temperature"
              min="0"
              max="2"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0.7 })}
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <Input
              type="number"
              id="maxTokens"
              min="1"
              max="32000"
              value={formData.maxTokens}
              onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) || 2000 })}
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="presencePenalty">Presence Penalty</Label>
            <Input
              type="number"
              id="presencePenalty"
              min="-2"
              max="2"
              step="0.1"
              value={formData.presencePenalty}
              onChange={(e) => setFormData({ ...formData, presencePenalty: parseFloat(e.target.value) || 0 })}
              disabled={isReadOnly}
            />
            <p className="text-xs text-gray-500">
              Number between -2.0 and 2.0. Positive values discourage repetition.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topP">Top P</Label>
            <Input
              type="number"
              id="topP"
              min="0"
              max="1"
              step="0.1"
              value={formData.topP}
              onChange={(e) => setFormData({ ...formData, topP: parseFloat(e.target.value) || 1 })}
              disabled={isReadOnly}
            />
            <p className="text-xs text-gray-500">
              Controls diversity via nucleus sampling. 0.1 means only the top 10% most likely tokens are considered.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add Test Button and Save Button */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleTestBatch}
          disabled={isReadOnly || isTestLoading || !fileData}
        >
          Test Batch
        </Button>
        <Button type="submit" disabled={isReadOnly}>
          Save Batch
        </Button>
      </div>

      {/* Test Results */}
      {(testResults.length > 0 || isTestLoading || testError) && (
        <TestResults
          results={testResults}
          isLoading={isTestLoading}
          error={testError}
        />
      )}
    </form>
  );
} 