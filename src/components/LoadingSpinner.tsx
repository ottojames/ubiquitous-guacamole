interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'purple' | 'indigo' | 'green';
  fullScreen?: boolean;
  message?: string;
}

export default function LoadingSpinner({
  size = 'md',
  color = 'blue',
  fullScreen = false,
  message
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    purple: 'border-purple-600',
    indigo: 'border-indigo-600',
    green: 'border-green-600'
  };

  const spinner = (
    <div className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`}></div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          {spinner}
          {message && (
            <p className="mt-4 text-gray-600 font-semibold">{message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        {spinner}
        {message && (
          <p className="mt-4 text-gray-600 font-semibold">{message}</p>
        )}
      </div>
    </div>
  );
}
