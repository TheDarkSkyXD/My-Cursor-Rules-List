import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Error - MealTime',
  description: 'Something went wrong',
};

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Something went wrong!</h1>
          <p className="text-lg text-gray-600">
            We apologize for the inconvenience. Please try again later.
          </p>
        </div>
        <div className="space-y-4">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try again
          </button>
          <p className="text-sm text-gray-500">
            If the problem persists, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
} 