'use client';

import { useSearchParams } from 'next/navigation';
import BatchPage from '@/components/BatchPage';

export default function NewBatchPage() {
  const searchParams = useSearchParams();
  const fileId = searchParams.get('fileId');

  return <BatchPage fileId={fileId || undefined} />;
} 