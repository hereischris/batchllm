import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BatchForm from '@/components/BatchForm';
import type { Batch, File } from '@/lib/db';
import { saveBatch, getFile, getAllFiles } from '@/lib/db';
import Toast from '@/components/Toast';

interface BatchPageProps {
  batch?: Batch;
  fileId?: string;
}

export default function BatchPage({ batch, fileId }: BatchPageProps) {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [allFiles, setAllFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    loadData();
  }, [batch, fileId]);

  const loadData = async () => {
    try {
      // Load all files first
      const files = await getAllFiles();
      setAllFiles(files);

      if (files.length === 0) {
        router.push('/files');
        return;
      }

      // If we have a specific file to load (from batch or fileId)
      const targetFileId = batch?.fileId || fileId;
      if (targetFileId) {
        const loadedFile = await getFile(targetFileId);
        if (loadedFile) {
          setFile(loadedFile);
        } else {
          setError('File not found');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (selectedFileId: string) => {
    try {
      setIsLoading(true);
      const selectedFile = await getFile(selectedFileId);
      if (!selectedFile) {
        setError('Selected file not found');
        return;
      }
      setFile(selectedFile);
      setError(undefined);
    } catch (error) {
      console.error('Error loading selected file:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: Partial<Batch>) => {
    try {
      const batchToSave: Batch = {
        ...data,
        id: batch?.id || uuidv4(),
        fileId: file?.id!,
        createdAt: batch?.createdAt || new Date(),
        status: batch?.status || 'pending',
      } as Batch;

      await saveBatch(batchToSave);
      setToast({
        message: batch ? 'Batch updated successfully' : 'Batch created successfully',
        type: 'success'
      });
      setTimeout(() => {
        router.push(`/batches/${batchToSave.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error saving batch:', error);
      setToast({
        message: `Error saving batch: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {batch ? batch.name : 'New Batch'}
          </h2>
          {batch && (
            <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span className="mr-2">Status:</span>
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                  batch.status === 'completed' ? 'bg-green-50 text-green-700' :
                  batch.status === 'error' ? 'bg-red-50 text-red-700' :
                  batch.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                  'bg-gray-50 text-gray-600'
                }`}>
                  {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                </span>
              </div>
              {batch.progress !== undefined && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span className="mr-2">Progress:</span>
                  <span>{Math.round(batch.progress * 100)}%</span>
                </div>
              )}
              {batch.costEstimate !== undefined && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span className="mr-2">Estimated Cost:</span>
                  <span>${batch.costEstimate.toFixed(4)}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          {batch?.status === 'completed' && (
            <button
              type="button"
              className="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              onClick={() => {/* TODO: Download results */}}
            >
              Download Results
            </button>
          )}
          {(batch?.status === 'pending' || batch?.status === 'error') && (
            <button
              type="button"
              className="ml-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              onClick={() => {/* TODO: Start processing */}}
            >
              {batch.status === 'error' ? 'Retry' : 'Start Processing'}
            </button>
          )}
          {batch?.status === 'processing' && (
            <button
              type="button"
              className="ml-3 inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              onClick={() => {/* TODO: Cancel processing */}}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
        <div className="px-4 py-6 sm:p-8">
          <BatchForm 
            batch={batch}
            fileData={file?.data}
            files={allFiles}
            isReadOnly={batch?.status === 'processing'} 
            onSubmit={handleSubmit}
            onFileSelect={handleFileSelect}
          />
        </div>
      </div>

      {batch?.logs && batch.logs.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Processing Logs</h3>
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {batch.logs.map((log, index) => (
                <li key={index} className="px-4 py-3 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`flex-shrink-0 h-2 w-2 rounded-full mr-2 ${
                        log.type === 'success' ? 'bg-green-400' :
                        log.type === 'error' ? 'bg-red-400' :
                        'bg-blue-400'
                      }`} />
                      <p className="text-sm text-gray-900">{log.message}</p>
                    </div>
                    <time className="ml-4 flex-shrink-0 text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
} 