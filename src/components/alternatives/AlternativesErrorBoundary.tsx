'use client';

import { Component, ReactNode } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class AlternativesErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Alternatives page error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-white border-2 border-black rounded-xl p-8 shadow-[6px_6px_0px_0px_#000]">
            <div className="flex items-center gap-3 mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-orange-500" />
              <h2 className="text-2xl font-bold text-black">Unable to load alternatives</h2>
            </div>
            <p className="text-base text-gray-600 mb-6 leading-[1.65]">
              We encountered an issue loading the alternatives page. Please try refreshing the page or contact support if the problem persists.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-6 py-3 bg-[#F6D200] border-2 border-black rounded-lg font-bold text-black hover:bg-[#F6D200]/80 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { AlternativesErrorBoundary };
export default AlternativesErrorBoundary;
