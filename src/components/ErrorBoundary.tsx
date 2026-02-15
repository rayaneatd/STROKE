import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={`p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-center ${this.props.className}`}>
            <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-red-500/20 rounded-full text-red-500">
                    <AlertTriangle size={24} />
                </div>
                <h2 className="text-lg font-bold text-red-500">Something went wrong</h2>
                <p className="text-sm text-red-400/80 max-w-md mx-auto mb-4">
                    {this.state.error?.message || 'An unexpected error occurred while rendering this component.'}
                </p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                >
                    <RotateCcw size={16} /> Reload Page
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
