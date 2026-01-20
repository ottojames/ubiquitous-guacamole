import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

type SectionErrorBoundaryProps = {
  children: React.ReactNode;
  /** Name of the section for error reporting (e.g., "Admin Portal", "Council Dashboard") */
  sectionName: string;
  /** Optional custom fallback UI */
  fallback?: React.ReactNode;
  /** Whether to show a retry button (default: true) */
  showRetry?: boolean;
};

type SectionErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
};

/**
 * Error boundary component for wrapping major page sections.
 * Provides user-friendly error messages and recovery options.
 */
export class SectionErrorBoundary extends React.Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<SectionErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error(`[${this.props.sectionName}] Error caught:`, error);
    console.error(`[${this.props.sectionName}] Component stack:`, errorInfo.componentStack);

    // Store error info for display
    this.setState({ errorInfo });

    // In production, you could send to error tracking service here
    // e.g., Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  handleRetry = () => {
    // Reset error state to attempt re-render
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { sectionName, showRetry = true } = this.props;
      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="min-h-[400px] flex items-center justify-center bg-gray-50 p-8">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>

            <p className="text-gray-600 mb-6">
              We encountered an error loading the {sectionName.toLowerCase()}.
              This has been logged and we're working to fix it.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {showRetry && (
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try again
                </button>
              )}

              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Go to homepage
              </button>
            </div>

            {/* Show error details in development mode */}
            {isDevelopment && this.state.error && (
              <div className="mt-6 p-4 bg-gray-100 rounded-md text-left">
                <p className="text-xs font-mono text-gray-500 mb-2">Development error details:</p>
                <p className="text-sm font-mono text-red-600 break-all">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 text-xs font-mono text-gray-600 overflow-auto max-h-32">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
