import { deleteAllBatches } from '@/lib/db';

async function cleanup() {
  try {
    await deleteAllBatches();
    console.log('Successfully deleted all batches');
  } catch (error) {
    console.error('Error deleting batches:', error);
  }
}

cleanup(); 