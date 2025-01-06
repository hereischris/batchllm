import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Transform Your Data with AI
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Upload CSV/Excel files, configure AI prompts, and run batch transformations. Process thousands of rows with ease.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/batches"
            className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Upload New File
          </Link>
          <Link
            href="/settings"
            className="text-sm font-semibold leading-6 text-gray-900"
          >
            Configure API Key <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
