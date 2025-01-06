'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { getAllFiles, saveFile, deleteFile, getBatchesByFile, type File } from '@/lib/db';
import { parseCSV } from '@/lib/fileUtils';
import DeleteConfirmation from '@/components/DeleteConfirmation';
import Toast from '@/components/Toast';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function FilesPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    fileId?: string;
    fileName?: string;
    batchCount?: number;
  }>({ isOpen: false });
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    const loadedFiles = await getAllFiles();
    setFiles(loadedFiles);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await parseCSV(file);
      const preview = data.slice(0, 5);
      const columnNames = Object.keys(data[0] || {});
      
      const newFile: File = {
        id: uuidv4(),
        name: file.name,
        uploadedAt: new Date(),
        data,
        preview,
        columnNames,
        rowCount: data.length,
      };

      await saveFile(newFile);
      await loadFiles();
      setToast({
        message: `File "${file.name}" uploaded successfully`,
        type: 'success',
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      setToast({
        message: `Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    }
    setIsUploading(false);
  };

  const handleDeleteClick = async (fileId: string, fileName: string) => {
    try {
      const batches = await getBatchesByFile(fileId);
      setDeleteConfirmation({
        isOpen: true,
        fileId,
        fileName,
        batchCount: batches.length,
      });
    } catch (error) {
      console.error('Error checking batches:', error);
      setToast({
        message: 'Error checking associated batches',
        type: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmation.fileId) return;

    try {
      await deleteFile(deleteConfirmation.fileId);
      await loadFiles();
      setToast({
        message: `File "${deleteConfirmation.fileName}" deleted successfully`,
        type: 'success',
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      setToast({
        message: `Error deleting file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    }
    setDeleteConfirmation({ isOpen: false });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold leading-6 text-gray-900">Files</h1>
            <p className="mt-2 text-sm text-gray-700">
              Upload and manage your CSV files for batch processing.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <label className="block">
              <span className="sr-only">Choose file</span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
        
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        File Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Upload Date
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Rows
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Columns
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {files.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                          No files yet. Upload a CSV file to get started.
                        </td>
                      </tr>
                    ) : (
                      files.map((file) => (
                        <tr key={file.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {file.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatDate(file.uploadedAt)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {file.rowCount.toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {file.columnNames.length}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-4">
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              onClick={() => router.push(`/batches/new?fileId=${file.id}`)}
                            >
                              Create Batch<span className="sr-only">, {file.name}</span>
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleDeleteClick(file.id, file.name)}
                            >
                              Delete<span className="sr-only">, {file.name}</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmation
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false })}
        onConfirm={handleDelete}
        title="Delete File"
        message={
          deleteConfirmation.batchCount
            ? `This file has ${deleteConfirmation.batchCount} associated batch${
                deleteConfirmation.batchCount === 1 ? '' : 'es'
              }. Deleting it will also delete all associated batches.`
            : 'Are you sure you want to delete this file? This action cannot be undone.'
        }
        itemName={deleteConfirmation.fileName || ''}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
} 