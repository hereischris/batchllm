'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BatchPage from '@/components/BatchPage';
import type { Batch } from '@/lib/db';
import { getBatch } from '@/lib/db';
import Toast from '@/components/Toast';

export default function BatchDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    loadBatch();
  }, [params.id]);

  const loadBatch = async () => {
    try {
      const loadedBatch = await getBatch(params.id);
      if (!loadedBatch) {
        router.push('/batches');
        return;
      }
      setBatch(loadedBatch);
    } catch (error) {
      console.error('Error loading batch:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
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

  if (!batch) {
    return null;
  }

  return <BatchPage batch={batch} />;
} 