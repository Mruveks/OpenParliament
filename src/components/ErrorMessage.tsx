import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({
  message = 'Something went wrong',
  detail,
  onRetry,
}: {
  message?: string;
  detail?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertTriangle className="text-amber-500 mb-3" size={40} />
      <p className="text-slate-600 dark:text-slate-300 font-medium">{message}</p>
      {detail && (
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-md">{detail}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </div>
  );
}
