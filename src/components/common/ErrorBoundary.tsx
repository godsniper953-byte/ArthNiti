import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  sectionName?: string;
  theme?: 'dark' | 'light';
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

/**
 * Reusable React Error Boundary to isolate component, 3D WebGL globe, chart, or route failures
 * so a single failed visualization or malformed payload never crashes the full ArthNiti terminal.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering error occurred in this module.',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error(
      `[ArthNiti ErrorBoundary] Isolated error in ${this.props.sectionName || 'Module'}:`,
      error,
      errorInfo?.componentStack
    );
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, errorMessage: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      const isDark = (this.props.theme ?? 'dark') === 'dark';
      return (
        <div
          role="alert"
          aria-live="assertive"
          className={`rounded-xl border p-6 my-4 space-y-3 ${
            isDark
              ? 'bg-red-950/20 border-red-500/40 text-slate-100'
              : 'bg-red-50 border-red-200 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {this.props.fallbackTitle ||
                `${this.props.sectionName || 'Dashboard Section'} Temporarily Unavailable`}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            ArthNiti isolated a rendering error in this component so the rest of the economic
            terminal remains operational. No fabricated or synthetic values were substituted.
          </p>
          {this.state.errorMessage && (
            <div className="text-[11px] font-mono-tabular px-3 py-2 rounded bg-black/30 text-red-300 border border-red-500/20 break-words">
              Diagnostic: {this.state.errorMessage}
            </div>
          )}
          <div className="pt-1">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset &amp; Retry Section</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
