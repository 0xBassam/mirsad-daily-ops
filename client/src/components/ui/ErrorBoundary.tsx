import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; message: string; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'An unexpected error occurred.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
          <AlertTriangle className="h-12 w-12 text-amber-400" />
          <h2 className="text-xl font-semibold text-slate-700">Something went wrong</h2>
          <p className="text-sm text-slate-400 max-w-sm">{this.state.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="btn-secondary text-sm"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
